import * as Yup from 'yup';

export const FocusSessionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  duration: Yup.number()
    .min(1, 'Duration must be at least 1 minute')
    .max(180, 'Duration must be less than 3 hours')
    .required('Duration is required'),
});
