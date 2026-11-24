<?php

namespace App\Services;

use App\Models\Order;

class VNPayService
{
    protected string $tmnCode;
    protected string $hashSecret;
    protected string $vnpUrl;
    protected string $returnUrl;

    public function __construct()
    {
        $this->tmnCode = (string) config('services.vnpay.tmn_code', 'CGXZLS0Z');
        $this->hashSecret = (string) config('services.vnpay.hash_secret', 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN');
        $this->vnpUrl = (string) config('services.vnpay.url', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        $this->returnUrl = (string) config('services.vnpay.return_url', 'http://localhost:3000/vnpay-return');
    }

    /**
     * Tạo URL chuyển hướng sang cổng thanh toán VNPay
     */
    public function createPaymentUrl(Order $order, ?string $ip = null): string
    {
        $vnp_TxnRef = $order->order_number;
        $vnp_OrderInfo = 'Thanh toan don hang #' . $order->order_number;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = (int) round($order->total_amount) * 100;
        $vnp_Locale = 'vn';
        $vnp_IpAddr = ($ip && $ip !== '::1') ? $ip : '127.0.0.1';

        $inputData = [
            'vnp_Version'    => '2.1.0',
            'vnp_TmnCode'    => $this->tmnCode,
            'vnp_Amount'     => $vnp_Amount,
            'vnp_Command'    => 'pay',
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_CurrCode'   => 'VND',
            'vnp_IpAddr'     => $vnp_IpAddr,
            'vnp_Locale'     => $vnp_Locale,
            'vnp_OrderInfo'  => $vnp_OrderInfo,
            'vnp_OrderType'  => $vnp_OrderType,
            'vnp_ReturnUrl'  => $this->returnUrl,
            'vnp_TxnRef'     => $vnp_TxnRef,
        ];

        ksort($inputData);
        $query = '';
        $i = 0;
        $hashdata = '';
        foreach ($inputData as $key => $value) {
            if ($i === 1) {
                $hashdata .= '&' . urlencode($key) . '=' . urlencode((string) $value);
            } else {
                $hashdata .= urlencode($key) . '=' . urlencode((string) $value);
                $i = 1;
            }
            $query .= urlencode($key) . '=' . urlencode((string) $value) . '&';
        }

        $vnp_Url = $this->vnpUrl . '?' . $query;
        if (!empty($this->hashSecret)) {
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $this->hashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
        }

        return $vnp_Url;
    }

    /**
     * Xác thực dữ liệu trả về từ VNPay
     */
    public function verifyReturn(array $params): array
    {
        $vnp_SecureHash = $params['vnp_SecureHash'] ?? '';
        $inputData = [];
        foreach ($params as $key => $value) {
            if (str_starts_with($key, 'vnp_')) {
                $inputData[$key] = $value;
            }
        }

        unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);

        ksort($inputData);
        $i = 0;
        $hashData = '';
        foreach ($inputData as $key => $value) {
            if ($i === 1) {
                $hashData .= '&' . urlencode($key) . '=' . urlencode((string) $value);
            } else {
                $hashData .= urlencode($key) . '=' . urlencode((string) $value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, $this->hashSecret);

        if (!empty($this->hashSecret) && !hash_equals($secureHash, $vnp_SecureHash)) {
            return [
                'isValid'      => false,
                'message'      => 'Chữ ký bảo mật không khớp (Invalid Signature).',
                'responseCode' => $params['vnp_ResponseCode'] ?? '97',
                'orderNumber'  => $params['vnp_TxnRef'] ?? null,
            ];
        }

        $responseCode = $params['vnp_ResponseCode'] ?? '';
        $isSuccess = ($responseCode === '00');

        return [
            'isValid'       => true,
            'isSuccess'     => $isSuccess,
            'responseCode'  => $responseCode,
            'orderNumber'   => $params['vnp_TxnRef'] ?? null,
            'amount'        => isset($params['vnp_Amount']) ? ((float) $params['vnp_Amount']) / 100 : 0,
            'transactionNo' => $params['vnp_TransactionNo'] ?? null,
            'bankCode'      => $params['vnp_BankCode'] ?? null,
            'payDate'       => $params['vnp_PayDate'] ?? null,
        ];
    }
}
