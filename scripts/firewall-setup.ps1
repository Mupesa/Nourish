# Nourish dev firewall setup — opens the ports the phone needs to reach this PC
# during local development (Expo Metro + Firebase emulators). Run as Administrator.
$log = "C:\Users\anesu\Documents\AI Application\Nourish\firewall-setup.log"
"Nourish firewall setup @ $(Get-Date)" | Out-File $log

$ports = @{
  "Nourish Dev (Metro 8081)"     = 8081
  "Nourish Dev (Functions 5001)" = 5001
  "Nourish Dev (Auth 9099)"      = 9099
}

foreach ($name in $ports.Keys) {
  $port = $ports[$name]
  try {
    Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue |
      Remove-NetFirewallRule -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow `
      -Protocol TCP -LocalPort $port -Profile Any -ErrorAction Stop | Out-Null
    "OK: opened TCP $port ($name)" | Tee-Object -FilePath $log -Append
  } catch {
    "FAIL: $port -> $($_.Exception.Message)" | Tee-Object -FilePath $log -Append
  }
}

# Also mark the current WiFi network as Private (friendlier firewall defaults).
try {
  Get-NetConnectionProfile | ForEach-Object {
    Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private -ErrorAction Stop
    "OK: network '$($_.Name)' set to Private" | Tee-Object -FilePath $log -Append
  }
} catch {
  "WARN: could not set network Private -> $($_.Exception.Message)" | Tee-Object -FilePath $log -Append
}

"DONE" | Tee-Object -FilePath $log -Append
