// Form Validation Utilities for Hasan's Flavors

export interface PasswordRuleStatus {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  rules: PasswordRuleStatus;
}

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const clean = email.trim();
  if (!clean) {
    return { isValid: false, error: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { isValid: true };
};

export const getPasswordRules = (password: string): PasswordRuleStatus => {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
};

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      isValid: false,
      error: 'Password is required.',
      rules: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const rules = getPasswordRules(password);
  const isValid =
    rules.minLength &&
    rules.hasUpper &&
    rules.hasLower &&
    rules.hasNumber &&
    rules.hasSpecial;

  if (!isValid) {
    if (!rules.minLength) {
      return { isValid: false, error: 'Password must be at least 8 characters long.', rules };
    }
    if (!rules.hasUpper) {
      return { isValid: false, error: 'Include at least one uppercase letter (A-Z).', rules };
    }
    if (!rules.hasLower) {
      return { isValid: false, error: 'Include at least one lowercase letter (a-z).', rules };
    }
    if (!rules.hasNumber) {
      return { isValid: false, error: 'Include at least one number (0-9).', rules };
    }
    if (!rules.hasSpecial) {
      return { isValid: false, error: 'Include at least one special character (!@#$%^&* etc.).', rules };
    }
  }

  return { isValid: true, rules };
};

export const validateSignInPassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.' };
  }
  return { isValid: true };
};

export const validateFullName = (name: string): { isValid: boolean; error?: string } => {
  const clean = name.trim();
  if (!clean) {
    return { isValid: false, error: 'Full name is required.' };
  }
  if (clean.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters.' };
  }
  return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  const clean = phone.trim();
  if (!clean) {
    return { isValid: false, error: 'Phone number is required.' };
  }
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, error: 'Please enter a valid phone number (7-15 digits).' };
  }
  return { isValid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirm: string
): { isValid: boolean; error?: string } => {
  if (!confirm) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirm) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true };
};
