import{push,ref,remove,set,update}from'firebase/database';import{db}from'../lib/firebase';import{DeviceCommand,Schedule}from'../types/schema';
export const sendFeedCommand=(deviceId:string,uid:string,payload:{motorType:string;direction:string;durationMs:number;source:string})=>{const cmd:DeviceCommand={id:`CMD-${Date.now()}`,type:'feed',status:'pending',createdAt:Date.now(),createdBy:uid,payload};return set(ref(db,`devices/${deviceId}/commands/active`),cmd)};
export const saveSchedule=(deviceId:string,id:string|undefined,schedule:Schedule)=> id?set(ref(db,`devices/${deviceId}/schedules/${id}`),schedule):set(push(ref(db,`devices/${deviceId}/schedules`)),schedule);
export const deleteSchedule=(deviceId:string,id:string)=>remove(ref(db,`devices/${deviceId}/schedules/${id}`));
export const updateDeviceSettings=(deviceId:string,patch:Record<string,unknown>)=>update(ref(db,`devices/${deviceId}`),patch);
