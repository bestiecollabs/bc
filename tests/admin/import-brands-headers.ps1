param([string]$Origin = "https://bestiecollabs.com")
$H = @{ "x-admin-email" = "collabsbestie@gmail.com" }

$badCsv = @"
brand,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based
Acme,https://acme.com,Beauty,,,https://ig.com/acme,,Nice brand,18,65,true
"@.Trim()

$goodCsv = @"
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based
Acme,https://acme.com,Beauty,,,https://ig.com/acme,,Nice brand,18,65,true
"@.Trim()

function PostCsv($csv){
  try{
    $r = Invoke-WebRequest -UseBasicParsing -Uri "$Origin/api/admin/import/brands/batches" `
         -Method Post -Headers $H -ContentType "text/plain" -Body $csv
    return @{ code=200; body=$r.Content }
  }catch{
    return @{ code=$_.Exception.Response.StatusCode.value__; body=$_.ErrorDetails.Message }
  }
}

$bad = PostCsv $badCsv
$good = PostCsv $goodCsv
$ok = ($bad.code -eq 400) -and ($good.code -eq 200)

"`nRESULT: " + ($(if($ok){"PASS"}else{"FAIL"}))
"BAD  -> " + $bad.code + " " + $bad.body
"GOOD -> " + $good.code + " " + $good.body
