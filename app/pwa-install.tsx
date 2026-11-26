'use client';
import {createContext,useContext} from 'react';
import {Download} from 'lucide-react';

export const PwaInstallContext=createContext<{installed:boolean;requestInstall:()=>void}|null>(null);

export default function InstallShalom(){
 const installation=useContext(PwaInstallContext);
 if(!installation||installation.installed)return null;
 return <button className="home-install-button" onClick={installation.requestInstall}><Download size={18}/><span>Instalar Shalom</span></button>;
}
