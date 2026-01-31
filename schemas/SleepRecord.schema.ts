import * as Yup from 'yup';

export const SleepRecordSchema = Yup.object().shape({
  startTime: Yup.string()
    .required('Start time is required'),
  endTime: Yup.string()
    .required('End time is required'),
  quality: Yup.number()
    .min(1, 'Quality must be between 1 and 5')
    .max(5, 'Quality must be between 1 and 5'),
  notes: Yup.string()
    .max(500, 'Notes must be less than 500 characters'),
});
