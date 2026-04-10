'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const translations: Record<string, Record<string, string>> = {
  sw: {
    // Dashboard
    'greeting': 'Habari',
    'app_name': 'Kikoba Smart',
    'wallet_balance': 'Salio la Mfuko Binafsi',
    'deposit': 'Weka Pesa',
    'withdraw': 'Toa',
    'my_savings': 'Akiba Yangu',
    'loan_balance': 'Baki ya Mkopo',
    'personal_plans': 'Mipango Binafsi',
    'add': 'Ongeza',
    'no_plans': 'Huna mipango yoyote binafsi bado.',
    'create_plan': 'Tengeneza Mpango',
    'transaction_history': 'Historia ya Miamala',
    'no_transactions': 'Hakuna miamala bado',
    'loading': 'Inapakia...',
    'failed_load': 'Imeshindwa kupakia data',
    'retry': 'Jaribu Tena',
    'continue': 'Endelea',
    'cancel': 'Ghairi',
    'save': 'Hifadhi',
    'amount_tzs': 'Kiasi (TZS)',
    'deposit_desc': 'Ingiza kiasi unachotaka kuweka kwenye mfuko wako binafsi.',
    'withdraw_desc': 'Pesa zitatumwa kwenye namba yako',
    'no_phone': 'Hujasajili namba',
    'choose_payment': 'Chagua Njia ya Malipo',
    'payment_provider': 'Mtoa huduma unayetaka kutumia:',
    'mobile_money': 'Mobile Money',
    'mobile_money_desc': 'M-Pesa, TigoPesa, AirtelMoney',
    'bank_card': 'Kadi ya Benki',
    'coming_soon': 'Inakuja hivi karibuni...',
    'plan_name': 'Jina la Mpango',
    'plan_name_placeholder': 'Mfn: Kununua Gari',
    'goal_amount': 'Lengo (TZS)',
    'deposit_to_plan': 'Weka Pesa kwa Mpango',
    'deposit_from_wallet': 'Pesa zitatoka kwenye mfuko wako binafsi.',
    // Bottom Nav
    'nav_home': 'Nyumbani',
    'nav_savings': 'Akiba',
    'nav_groups': 'Vikundi',
    'nav_profile': 'Wasifu',
    // Profile
    'my_profile': 'Wasifu Wangu',
    'profile_subtitle': 'Taarifa zako binafsi za Kikoba Smart',
    'member_code': 'Namba ya Utambulisho',
    'email': 'Barua Pepe',
    'phone': 'Simu',
    'member_since': 'Mwanachama tangu',
    'not_filled': 'Hujajaza',
    'language': 'Lugha',
    'edit_info': 'Hariri Taarifa',
    'username': 'Jina Lako (Username)',
    'enter_name': 'Ingiza jina lako',
    'email_locked': 'Barua pepe haiwezi kubadilishwa.',
    'phone_number': 'Nambari ya Simu',
    'phone_placeholder': 'Mfano: +255 700 000 000',
    'updated_success': 'Taarifa zako zimesasishwa kikamilifu',
    'update_failed': 'Imeshindwa kusasisha. Jaribu tena.',
    'sign_out': 'Toka',
  },
  en: {
    // Dashboard
    'greeting': 'Hello',
    'app_name': 'Kikoba Smart',
    'wallet_balance': 'Personal Wallet Balance',
    'deposit': 'Deposit',
    'withdraw': 'Withdraw',
    'my_savings': 'My Savings',
    'loan_balance': 'Loan Balance',
    'personal_plans': 'Personal Plans',
    'add': 'Add',
    'no_plans': 'You have no personal plans yet.',
    'create_plan': 'Create Plan',
    'transaction_history': 'Transaction History',
    'no_transactions': 'No transactions yet',
    'loading': 'Loading...',
    'failed_load': 'Failed to load data',
    'retry': 'Retry',
    'continue': 'Continue',
    'cancel': 'Cancel',
    'save': 'Save',
    'amount_tzs': 'Amount (TZS)',
    'deposit_desc': 'Enter the amount you want to deposit into your personal wallet.',
    'withdraw_desc': 'Funds will be sent to your number',
    'no_phone': 'No phone registered',
    'choose_payment': 'Choose Payment Method',
    'payment_provider': 'Select the provider you want to use:',
    'mobile_money': 'Mobile Money',
    'mobile_money_desc': 'M-Pesa, TigoPesa, AirtelMoney',
    'bank_card': 'Bank Card',
    'coming_soon': 'Coming soon...',
    'plan_name': 'Plan Name',
    'plan_name_placeholder': 'E.g: Buy a Car',
    'goal_amount': 'Target (TZS)',
    'deposit_to_plan': 'Deposit to Plan',
    'deposit_from_wallet': 'Funds will be taken from your personal wallet.',
    // Bottom Nav
    'nav_home': 'Home',
    'nav_savings': 'Savings',
    'nav_groups': 'Groups',
    'nav_profile': 'Profile',
    // Profile
    'my_profile': 'My Profile',
    'profile_subtitle': 'Your personal Kikoba Smart information',
    'member_code': 'Member ID',
    'email': 'Email',
    'phone': 'Phone',
    'member_since': 'Member since',
    'not_filled': 'Not set',
    'language': 'Language',
    'edit_info': 'Edit Info',
    'username': 'Your Name (Username)',
    'enter_name': 'Enter your name',
    'email_locked': 'Email cannot be changed.',
    'phone_number': 'Phone Number',
    'phone_placeholder': 'E.g: +255 700 000 000',
    'updated_success': 'Your information has been updated successfully',
    'update_failed': 'Failed to update. Please try again.',
    'sign_out': 'Sign Out',
  }
}

interface I18nContextType {
  lang: string
  setLang: (lang: string) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'sw',
  setLang: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState('sw')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kikoba_lang')
      if (saved && translations[saved]) {
        setLangState(saved)
      }
    } catch {}
  }, [])

  const setLang = (code: string) => {
    setLangState(code)
    try { localStorage.setItem('kikoba_lang', code) } catch {}
  }

  const t = (key: string) => {
    return translations[lang]?.[key] || translations['sw']?.[key] || key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
