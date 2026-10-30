import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
// supase credential keys to call the supabase client to connect to the backend to send and retrieve info.
const supabaseUrl = "https://vbnvocgfbmtyprolmkdd.supabase.co";
const supabasePublishableKey = "sb_publishable_2Vk3RGTNUvNnvdl2MVASTQ_lc25-hRU";

export const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey
);