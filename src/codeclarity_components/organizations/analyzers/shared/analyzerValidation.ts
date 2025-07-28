import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

export const analyzerValidationSchema = toTypedSchema(
    z.object({
        name: z.string().min(5, 'Please enter a name (minimum 5 characters)'),
        description: z.string().min(10, 'Please enter a description (minimum 10 characters)')
    })
);

export const analyzerValidationRules = {
    name: {
        minLength: 5,
        errorMessage: 'Please enter a name (minimum 5 characters)'
    },
    description: {
        minLength: 10,
        errorMessage: 'Please enter a description (minimum 10 characters)'
    }
} as const;
