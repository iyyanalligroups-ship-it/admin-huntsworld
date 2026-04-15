import { useState, useEffect } from 'react';
import { useRedeemPointsMutation } from '@/redux/api/couponsNotificationApi';
import { useGetPaymentAccountsByUserQuery } from '@/redux/api/PaymentAccountApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import showToast from '@/toast/showToast';
import { Loader2, AlertTriangle, CheckCircle2, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Loader from '@/loader/Loader';

const CashRedeemPointsForm = ({ adminId, userId, walletPoints, onSuccess }) => {
  const [formData, setFormData] = useState({
    redeem_point: '',
    reason: '',
  });

  const [redeemPoints, { isLoading: isRedeeming }] = useRedeemPointsMutation();
  const { data: paymentAccounts, isLoading: isPaymentLoading } = useGetPaymentAccountsByUserQuery(userId);

  // Filter for active/verified account (or just take the first one for now as per student module)
  const activeAccount = paymentAccounts?.data?.find(acc => acc.is_active) || paymentAccounts?.data?.[0];

  const REDEEM_OPTIONS = [2500, 5000, 7500, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.redeem_point || !formData.reason) {
      showToast('Points and reason are required', 'error');
      return;
    }

    if (!activeAccount) {
      showToast('Student has no active payment account', 'error');
      return;
    }

    if (parseInt(formData.redeem_point) > walletPoints) {
      showToast('Insufficient wallet points', 'error');
      return;
    }

    try {
      await redeemPoints({
        user_id: userId,
        redeem_point: parseInt(formData.redeem_point),
        coupon_code: `CASH-${uuidv4()}`, // Different prefix for cash
        reason: formData.reason,
        admin_id: adminId,
        payment_method: activeAccount.payment_method, // Track which method was used
        redemption_type: 'cash',
      }).unwrap();

      showToast('Cash redemption request submitted successfully!', 'success');
      onSuccess();
    } catch (error) {
      showToast(error.data?.message || 'Failed to redeem points', 'error');
    }
  };

  if (isPaymentLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#0c1f4d]" />
        <p className="mt-2 text-sm text-gray-500">Fetching payment details...</p>
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col items-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
          <h3 className="font-bold text-amber-900">No Payment Account Found</h3>
          <p className="text-sm text-amber-700 mt-1">
            This student has not added any payment details (Bank/UPI). 
            Cash redemption is not possible until they add an account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Payment Account Display */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-200 pb-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Verified Payment Method</span>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            {activeAccount.payment_method === 'BANK' && <Banknote className="text-blue-600" />}
            {activeAccount.payment_method === 'UPI_ID' && <CreditCard className="text-purple-600" />}
            {activeAccount.payment_method === 'UPI_NUMBER' && <Smartphone className="text-green-600" />}
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="text-sm font-bold text-[#0c1f4d]">
              {activeAccount.payment_method === 'BANK' ? 'Bank Transfer' : activeAccount.payment_method.replace('_', ' ')}
            </p>
            
            {activeAccount.payment_method === 'BANK' && (
              <div className="text-xs text-gray-600 grid grid-cols-1 gap-0.5">
                <p><strong>Holder:</strong> {activeAccount.bank_details?.account_holder_name}</p>
                <p><strong>Acc No:</strong> {activeAccount.bank_details?.account_number}</p>
                <p><strong>IFSC:</strong> {activeAccount.bank_details?.ifsc_code}</p>
              </div>
            )}
            
            {activeAccount.payment_method === 'UPI_ID' && (
              <p className="text-xs font-medium text-gray-600">{activeAccount.upi_id}</p>
            )}
            
            {activeAccount.payment_method === 'UPI_NUMBER' && (
              <p className="text-xs font-medium text-gray-600">{activeAccount.upi_number}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#0c1f4d]">Redeem Amount (Points)</label>
          <Select
            value={formData.redeem_point}
            onValueChange={(value) => setFormData({ ...formData, redeem_point: value })}
          >
            <SelectTrigger className="w-full border-2 focus:ring-[#0c1f4d] h-11">
              <SelectValue placeholder="Select points block" />
            </SelectTrigger>
            <SelectContent>
              {REDEEM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt.toString()} disabled={opt > walletPoints}>
                  {opt.toLocaleString()} Points {opt > walletPoints ? '(Insufficient)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-gray-400 italic">As per SOP, withdrawals are restricted to fixed point blocks.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-[#0c1f4d]">Internal Remarks / Reason</label>
          <Textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Reason for cash redemption..."
            className="border-2 focus:ring-[#0c1f4d] min-h-[100px]"
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer bg-[#0c1f4d] hover:bg-[#0c204d] text-white font-bold py-6 rounded-xl shadow-lg transition-all"
          disabled={isRedeeming}
        >
          {isRedeeming ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Request...
            </div>
          ) : (
            'Authorize Cash Redemption'
          )}
        </Button>
      </form>
    </div>
  );
};

export default CashRedeemPointsForm;
