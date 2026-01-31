import * as Yup from 'yup';

export const WaterReminderSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  description: Yup.string()
    .max(200, 'Description must be less than 200 characters'),
  targetAmount: Yup.number()
    .min(100, 'Target must be at least 100ml')
    .max(10000, 'Target must be less than 10L')
    .required('Target amount is required'),
});

export const WaterIntakeSchema = Yup.object().shape({
  amount: Yup.number()
    .min(1, 'Amount must be at least 1ml')
    .max(2000, 'Amount must be less than 2L')
    .required('Amount is required'),
});
