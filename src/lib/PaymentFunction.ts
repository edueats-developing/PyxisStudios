interface PaymentDetails {
  amount: number;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export const processPayment = async (paymentDetails: PaymentDetails): Promise<boolean> => {
  // This is a mock function. In a real application, you would integrate with a payment gateway here.
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate a successful payment 90% of the time
      const isSuccessful = Math.random() < 0.9;
      resolve(isSuccessful);
    }, 2000); // Simulate a 2-second processing time
  });
};
