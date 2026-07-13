import { Haptics, NotificationType } from '@capacitor/haptics'
import { isNative } from './native'

/** Answer feedback tap; silent no-op on web and on any native failure. */
export function answerHaptic(correct: boolean): void {
  if (!isNative) return
  Haptics.notification({
    type: correct ? NotificationType.Success : NotificationType.Error,
  }).catch(() => {})
}
