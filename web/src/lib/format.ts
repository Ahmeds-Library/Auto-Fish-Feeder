export const timeAgo=(value?:number)=>{if(!value)return'Never';const diff=Date.now()-value;if(diff<60000)return'just now';if(diff<3600000)return`${Math.floor(diff/60000)}m ago`;if(diff<86400000)return`${Math.floor(diff/3600000)}h ago`;return new Date(value).toLocaleString()};
export const isOnline=(lastSeen?:number)=>!!lastSeen&&Date.now()-lastSeen<120000;

export function wifiQuality(rssi?: number | null) {
  if (typeof rssi !== 'number' || Number.isNaN(rssi)) {
    return { label: 'Unknown', value: 'Unknown' };
  }
  const label = rssi >= -55 ? 'Excellent' : rssi >= -67 ? 'Good' : rssi >= -75 ? 'Fair' : 'Weak';
  return { label, value: `${label} (${rssi} dBm)` };
}
