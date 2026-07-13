import { isNative } from './native'

/** Answer feedback tap; silent no-op on web and on any native failure.
 * Dynamic import keeps the plugin out of the web bundle (branch convention). */
export function answerHaptic(correct: boolean): void {
  if (!isNative) return
  import('@capacitor/haptics')
    .then(({ Haptics, NotificationType }) =>
      Haptics.notification({
        type: correct ? NotificationType.Success : NotificationType.Error,
      }),
    )
    .catch(() => {})
}
