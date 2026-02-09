import {
  ApplicationVerifier,
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../../config/firebase";

/**
 * Sends a verification code to the given phone number
 */
export const sendVerificationCode = async (
  phoneNumber: string,
  recaptchaVerifier: ApplicationVerifier,
) => {
  const provider = new PhoneAuthProvider(auth);
  return await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
};

/**
 * Verifies the code sent to the phone and signs the user in
 */
export const confirmVerificationCode = async (
  verificationId: string,
  verificationCode: string,
) => {
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode,
  );
  return await signInWithCredential(auth, credential);
};
