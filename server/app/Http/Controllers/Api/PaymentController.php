<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\VNPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(
        protected VNPayService $vnpayService
    ) {}

    /**
     * Tạo URL thanh toán VNPay cho đơn hàng (dùng khi checkout hoặc thanh toán lại đơn cũ)
     */
    public function createVNPayUrl(Request $request, string $orderId)
    {
        $order = Order::where('order_number', $orderId)
            ->orWhere('id', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy đơn hàng.',
            ], 404);
        }

        if ($order->payment_status === 'paid') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đơn hàng này đã được thanh toán thành công.',
            ], 400);
        }

        if ($order->status === 'cancelled') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Đơn hàng đã bị hủy, không thể tiếp tục thanh toán.',
            ], 400);
        }

        $url = $this->vnpayService->createPaymentUrl($order, $request->ip());

        return response()->json([
            'status'      => 'success',
            'payment_url' => $url,
            'order'       => $order,
        ]);
    }

    /**
     * Tiếp nhận kết quả thanh toán từ VNPay (Return URL)
     */
    public function vnpayReturn(Request $request)
    {
        $result = $this->vnpayService->verifyReturn($request->all());

        if (!$result['isValid']) {
            return response()->json([
                'status'  => 'error',
                'message' => $result['message'],
                'data'    => $result,
            ], 400);
        }

        $orderNumber = $result['orderNumber'];
        $order = Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Không tìm thấy đơn hàng #' . $orderNumber,
                'data'    => $result,
            ], 404);
        }

        if ($result['isSuccess']) {
            DB::transaction(function () use ($order, $result, $request) {
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => $order->status === 'pending' ? 'processing' : $order->status,
                ]);

                Payment::updateOrCreate(
                    [
                        'order_id'       => $order->id,
                        'payment_method' => 'vnpay',
                    ],
                    [
                        'transaction_id' => $result['transactionNo'],
                        'amount'         => $result['amount'],
                        'status'         => 'completed',
                        'paid_at'        => now(),
                        'metadata'       => $request->all(),
                    ]
                );
            });

            return response()->json([
                'status'  => 'success',
                'message' => 'Thanh toán đơn hàng thành công qua VNPay.',
                'order'   => $order->fresh(['items.product', 'latestPayment']),
                'data'    => $result,
            ]);
        }

        // Trường hợp người dùng hủy hoặc lỗi thẻ
        Payment::updateOrCreate(
            [
                'order_id'       => $order->id,
                'payment_method' => 'vnpay',
            ],
            [
                'transaction_id' => $result['transactionNo'],
                'amount'         => $result['amount'],
                'status'         => 'failed',
                'metadata'       => $request->all(),
            ]
        );

        $responseMessages = [
            '24' => 'Giao dịch bị hủy do quý khách đã hủy thanh toán.',
            '11' => 'Giao dịch không thành công: Đã hết hạn chờ thanh toán.',
            '51' => 'Tài khoản không đủ số dư để thực hiện giao dịch.',
            '79' => 'Khách hàng nhập sai mật khẩu xác thực quá số lần quy định.',
        ];

        return response()->json([
            'status'  => 'failed',
            'message' => $responseMessages[$result['responseCode']] ?? 'Thanh toán không thành công. Mã phản hồi: ' . $result['responseCode'],
            'order'   => $order->fresh(),
            'data'    => $result,
        ]);
    }
}
