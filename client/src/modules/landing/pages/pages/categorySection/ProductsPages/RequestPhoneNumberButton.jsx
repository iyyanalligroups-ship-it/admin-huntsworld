import React, { useState, useEffect } from 'react';
import { PhoneOutgoing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRequestPhoneNumberAccessMutation } from '@/redux/api/PhoneNumberAccessApi';
import showToast from '@/toast/showToast';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

const RequestPhoneNumberButton = ({ customerId, sellerId, merchantId }) => {
  const [requestPhoneNumberAccess, { isLoading }] = useRequestPhoneNumberAccessMutation();
  const [phoneNumber, setPhoneNumber] = useState(null);

  useEffect(() => {
    socket.on('phoneNumberRequestApproved', (data) => {
      if (data.seller_id === sellerId) {
        setPhoneNumber(data.phone_number);
        showToast(data.message, 'success');
      }
    });

    socket.on('phoneNumberRequestRejected', (data) => {
      if (data.seller_id === sellerId) {
        showToast(data.message, 'error');
      }
    });

    return () => {
      socket.off('phoneNumberRequestApproved');
      socket.off('phoneNumberRequestRejected');
    };
  }, [sellerId]);

  const handleRequest = async () => {
    try {
      const response = await requestPhoneNumberAccess({
        customer_id: customerId,
        seller_id: sellerId,
        merchant_id: merchantId,
      }).unwrap();
      if (response.phone_number) {
        setPhoneNumber(response.phone_number);
      } else {
        showToast('Phone number access request sent', 'success');
      }
    } catch (error) {
      showToast(error?.data?.message || 'Failed to request phone number access', 'error');
    }
  };

  if (phoneNumber) {
    return (
      <div className="flex flex-col py-1">
        <span className="font-semibold">Phone Number</span>
        <span>{phoneNumber}</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleRequest}
      disabled={isLoading}
      className="cursor-pointer mt-2"
    >
      <PhoneOutgoing className="mr-2" size={16} />
      {isLoading ? 'Requesting...' : 'View Number'}
    </Button>
  );
};

export default RequestPhoneNumberButton;