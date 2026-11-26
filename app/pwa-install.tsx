'use client';
import {createContext,useContext} from 'react';
import {Download,RefreshCw} from 'lucide-react';

export const PwaInstallContext=createContext<{installed:boolean;requestInstall:()=>void;openUpdates:()=>void}|null>(null);

export function UpdateShalom(){
 const installation=useContext(PwaInstallContext);
 if(!installation)return null;
 return <button className="home-install-button" onClick={installation.openUpdates}><RefreshCw size={17}/><span>Actualizar Shalom</span></button>;
}

export default function InstallShalom(){
 const installation=useContext(PwaInstallContext);
 if(!installation)return null;
 if(installation.installed)return <UpdateShalom/>;
 return <button className="home-install-button" onClick={installation.requestInstall}><Download size={18}/><span>Instalar Shalom</span></button>;
}
