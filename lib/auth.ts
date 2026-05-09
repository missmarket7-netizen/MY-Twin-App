import { supabase } from './supabase';

export async function getSession() {
  try {
      const { data } = await supabase.auth.getSession();
          return data.session;
            } catch {
                return null;
                  }
                  }

                  export async function getAccessToken() {
                    try {
                        const session = await getSession();
                            return session?.access_token || null;
                              } catch {
                                  return null;
                                    }
                                    }

                                    export function onAuthStateChange(callback: (user: any) => void) {
                                      const { data } = supabase.auth.onAuthStateChange((event, session) => {
                                          callback(session?.user || null);
                                            });
                                              return data.subscription;
                                              }