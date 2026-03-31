import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. 取得來訪者 IP (Nitro 內建支援 Vercel 等平台的 x-forwarded-for 標頭)
  const ip = getRequestIP(event, { xForwardedFor: true }) || '未知 IP'
  
  // 2. 取得設備資訊 (User-Agent)
  const userAgent = getHeader(event, 'user-agent') || '未知設備'

  try {
    // 3. 取得 Supabase 客戶端並寫入資料庫
    const supabase = await serverSupabaseClient(event)
    
    const { error } = await supabase.from('visitor_logs').insert([
      { 
        ip_address: ip, 
        user_agent: userAgent 
      }
    ])

    if (error) throw error

    return { success: true, message: '紀錄成功' }
  } catch (err) {
    console.error('寫入來訪紀錄失敗:', err)
    return { success: false, message: '紀錄失敗' }
  }
})