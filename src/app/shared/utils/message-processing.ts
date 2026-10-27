import { ContactModel, MessageModel } from "../store";

export class ContactExtractData
{
    static getWhatsappPhone(contact:ContactModel)
    {
        return (contact?.phoneNumbers || []).find((phone)=>phone.label=="whatsapp");
    }

    static getDefaultMail(contact:ContactModel)
    {
        return (contact?.emails || []).find((email)=> email.label=="default")
    }
}

export class MessageProcessing
{
    
    static replaceVar(text:string,varArray:Record<string,any>):string
    {
      // Toutes les occurrences sont remplacees (comme cote serveur).
      Object.keys(varArray).forEach((key)=>{
        const value = varArray[key] ?? `%${key}%`;
        text = text.split(`{{${key}}}`).join(String(value));
      });
      return text;
    }

    static getVarList(text:string):string[]
    {
        return Array.from(text.matchAll(/{{([a-zA-Z]+)}}/g)).map((varFound)=>varFound[1])
    }
  
    static extractPhoneID(phoneNumber:string)
    {
      return String(phoneNumber || "").replace(/\D/g, "")
    }

    static getVarListWithValues(contact:ContactModel,sender,dateToSend):Record<string,any>
    {
        return {
            senderEmail:sender?.email || "",
            senderFullName:`${sender?.firstName || ""} ${sender?.lastName || ""}`.trim(),
            receiverFullName:`${contact?.fullName || ""}`,
            receiverEmail: ContactExtractData.getDefaultMail(contact)?.email || "",
            dateToSend:(dateToSend?new Date(dateToSend):new Date()).toLocaleDateString("fr-FR",{timeZone:"Africa/Douala"}),
            plateform: "NufiSend"
        }
    }    
        
    static getPersonalizedMessage(bodyText,contact:ContactModel,sender,dateToSend)
    {
        let varsValues = MessageProcessing.getVarListWithValues(contact,sender,dateToSend);
        let varsList = MessageProcessing.getVarList(bodyText || "");        
        let values = {};
        varsList.forEach((varItem)=>{
            if(varsValues.hasOwnProperty(varItem)) values[varItem]=varsValues[varItem];
        })
        return MessageProcessing.replaceVar(bodyText,values)
    }
}