import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import * as yup from 'yup';
import { BANNER_TYPES, BannerType } from '~/types/banner-type';

dayjs.extend(utc);
dayjs.extend(timezone);

export const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const bannerConfigYupSchema = yup.object({
  summary: yup
    .string()
    .required()
    .min(5, 'Must be at least 5 characters')
    .max(500, 'Must be at most 500 characters'),

  type: yup
    .mixed<BannerType>()
    .oneOf([...BANNER_TYPES])
    .required(),

  startTime: yup
    .string()
    .matches(hhmmRegex, 'startTime must be in HH:mm 24-hour format')
    .when(['year', 'month', 'dayOfWeek', 'dayOfMonth'], {
      is: (year, month, dayOfWeek, dayOfMonth) => year ?? month ?? dayOfWeek ?? dayOfMonth,
      then: (schema) => schema.required('startTime is required'),
      otherwise: (schema) => schema.notRequired(),
    }),

  endTime: yup
    .string()
    .matches(hhmmRegex, 'endTime must be in HH:mm 24-hour format')
    .when(['year', 'month', 'dayOfWeek', 'dayOfMonth'], {
      is: (year, month, dayOfWeek, dayOfMonth) => year ?? month ?? dayOfWeek ?? dayOfMonth,
      then: (schema) => schema.required('endTime is required'),
      otherwise: (schema) => schema.notRequired(),
    }),

  timeZone: yup
    .string()
    .optional()
    .test(
      'is-valid-timezone',
      'Invalid timeZone format, expected valid IANA zone like "UTC" or "Asia/Shanghai"',
      (value) => (!value ? true : dayjs().tz(value, true).isValid()),
    ),

  dayOfWeek: yup.number().min(0).max(6).notRequired(),

  dayOfMonth: yup
    .number()
    .min(1, 'dayOfMonth must be between 1 and 31')
    .max(31, 'dayOfMonth must be between 1 and 31')
    .when(['year', 'month'], {
      is: (year, month) => Boolean(year || month),
      then: (schema) => schema.required('dayOfMonth is required when year or month is specified'),
      otherwise: (schema) => schema.notRequired(),
    }),

  year: yup
    .number()
    .integer('year must be an integer')
    .min(1970, 'year must be >= 1970')
    .max(9999, 'year must be <= 9999')
    .notRequired(),

  month: yup
    .number()
    .integer('month must be an integer')
    .min(1, 'month must be between 1 and 12')
    .max(12, 'month must be between 1 and 12')
    .notRequired(),
});
