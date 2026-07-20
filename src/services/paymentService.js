import api from './api';

export const getPlans = async () => {
  const response = await api.get('/payment/plans');
  return response.data;
};

export const createCheckoutUrl = async (planId, cancelUrl, returnUrl) => {
  const response = await api.post('/payment/checkout', {
    planId,
    cancelUrl,
    returnUrl,
  });
  return response.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payment/history');
  return response.data;
};
