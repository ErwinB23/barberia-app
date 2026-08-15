export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = LoginFormValues & {
  fullName: string;
  phone: string;
  passwordConfirmation: string;
};

export type RecoveryRequestFormValues = Pick<LoginFormValues, 'email'>;

export type NewPasswordFormValues = {
  password: string;
  passwordConfirmation: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;
export type RecoveryRequestFormErrors = Partial<Record<keyof RecoveryRequestFormValues, string>>;
export type NewPasswordFormErrors = Partial<Record<keyof NewPasswordFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9()\-\s]+$/;

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function isValidPhone(phone: string) {
  const digitCount = phone.replace(/\D/g, '').length;

  return phone.length >= 7 && phone.length <= 30 && digitCount >= 7 && PHONE_PATTERN.test(phone);
}

export function normalizeLoginInput(values: LoginFormValues): LoginFormValues {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

export function normalizeRecoveryRequestInput(
  values: RecoveryRequestFormValues,
): RecoveryRequestFormValues {
  return {
    email: values.email.trim().toLowerCase(),
  };
}

export function normalizeRegisterInput(values: RegisterFormValues): RegisterFormValues {
  return {
    fullName: collapseWhitespace(values.fullName),
    phone: collapseWhitespace(values.phone),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    passwordConfirmation: values.passwordConfirmation,
  };
}

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const email = values.email.trim();

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (!values.password) {
    errors.password = 'Ingresa tu contraseña.';
  }

  return errors;
}

export function validateRecoveryRequestForm(
  values: RecoveryRequestFormValues,
): RecoveryRequestFormErrors {
  const errors: RecoveryRequestFormErrors = {};

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  return errors;
}

export function validateNewPasswordForm(values: NewPasswordFormValues): NewPasswordFormErrors {
  const errors: NewPasswordFormErrors = {};

  if (values.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.';
  }

  return errors;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = validateLoginForm(values);
  const fullName = collapseWhitespace(values.fullName);
  const phone = collapseWhitespace(values.phone);

  if (fullName.length < 2 || fullName.length > 120) {
    errors.fullName = 'El nombre debe tener entre 2 y 120 caracteres.';
  }

  if (!isValidPhone(phone)) {
    errors.phone = 'Ingresa un teléfono válido de entre 7 y 30 caracteres.';
  }

  if (values.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.';
  }

  return errors;
}
