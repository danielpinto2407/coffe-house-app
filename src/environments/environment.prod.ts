export const environment = {
  production: true,
  supabase: {
    url: 'https://zeauqjdwayafrjsqcbrm.supabase.co',
    key: 'sb_publishable_hph7G1KEarRzl_fPrqrdww_G4vnuwV0'
  },
  qr: {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H' as const,
    colors: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  }
};
