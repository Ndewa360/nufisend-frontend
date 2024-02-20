import { WhatsappQrCodeModel } from "./whatsapp-qrcode.model"

export namespace WhatsappQrCodeAction
{
    //Set Qr Code
    export class SetWhatsAppQrCode
    {
        static readonly type = '[WhatsappQrCode] Set Qr Code'
        constructor(public qrCode:string){}
    }

     //Set Qr Code
     export class SetLoadingQrCode
     {
         static readonly type = '[WhatsappQrCode] Set Loading Qr Code'
         constructor(public loading:boolean){}
     }

}
