import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

export function successToast(text: string) {
    const $toast = useToast();
    const instance = $toast.success(text, {
        position: 'bottom-right',
        onClick: () => {
            instance.dismiss();
        },
        duration: 2000
    });
}

export function errorToast(text: string) {
    const $toast = useToast();
    const instance = $toast.error(text, {
        position: 'bottom-right',
        onClick: () => {
            instance.dismiss();
        },
        duration: 2000
    });
}
