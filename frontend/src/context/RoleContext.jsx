import {createContext,useContext,useEffect,useMemo,useState} from 'react';
const RoleContext=createContext(null);
export function RoleProvider({children}){const [userRole,setUserRole]=useState(()=>localStorage.getItem('bis_user_role')||'officer');useEffect(()=>localStorage.setItem('bis_user_role',userRole),[userRole]);const value=useMemo(()=>({userRole,setRole:setUserRole,toggleRole:()=>setUserRole(r=>r==='officer'?'contractor':'officer'),isOfficer:userRole==='officer',isContractor:userRole==='contractor'}),[userRole]);return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>}
export function useRole(){return useContext(RoleContext)}
