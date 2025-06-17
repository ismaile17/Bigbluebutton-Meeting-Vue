import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useBuyingStore = defineStore({
  id: 'buying',
  state: () => ({
    packagelist: [], 
    moneytransferlist: [], 
    invoicelist: [], 
    userpackage: {},
    purchaseslist:[] as any[],
    addpackagetransferorgift: {} as any,
    addmoneytransfer: {} as any,
    addinvoice: {} as any,



  }),
  actions: {
    async getAllPackage() {
      try {
        const packageData = await fetchWrapper.get(`${baseUrl}/package/package`);
        if (packageData && packageData.value) {
          this.packagelist = packageData.value;
        } else {
          console.error("Package data is empty or undefined");
        }
        return packageData.value;
      } catch (error) {
        console.error("Error fetching package data:", error);
        return [];
      }
    },

    async getUserPackage(){
      const userPackageData = await fetchWrapper.get(`${baseUrl}/package/getuserpackagebyuserid`);
      this.userpackage = userPackageData;
      return userPackageData;
  },
  async getPurchasesListByUserId(){
    const purchasesListsss = await fetchWrapper.get(`${baseUrl}/payment/purchaseslist`);
    this.purchaseslist = purchasesListsss;
    return purchasesListsss;
},

async addPackageMoneyTransferOrGift(args: any) {
  const packageAddData = await fetchWrapper.post(`${baseUrl}/payment/addmoneytransferorgift`, args);
  this.addpackagetransferorgift = packageAddData;
  return packageAddData;
},

async addMoneyTransferTicket(args: any) {
  const packageAddData = await fetchWrapper.post(`${baseUrl}/payment/moneytransfer`, args);
  this.addmoneytransfer = packageAddData;
  return packageAddData;
},

async addInvoceTrue(args: any) {
  const packageAddData = await fetchWrapper.post(`${baseUrl}/payment/invoicecreateforadmin`, args);
  this.addinvoice = packageAddData;
  return packageAddData;
},

async getAllMoneyTransferList() {
  try {
    const moneyTransferData = await fetchWrapper.get(`${baseUrl}/payment/moneytransferlistforadmin`);
    if (moneyTransferData && moneyTransferData.value) {
      this.moneytransferlist = moneyTransferData.value;
    } else {
      console.error("Package data is empty or undefined");
    }
    return moneyTransferData.value;
  } catch (error) {
    console.error("Error fetching package data:", error);
    return [];
  }
},

async getAllInvoiceList() {
  try {
    const moneyTransferData = await fetchWrapper.get(`${baseUrl}/payment/invocecreatelistforadmin`);
    if (moneyTransferData && moneyTransferData.value) {
      this.invoicelist = moneyTransferData.value;
    } else {
      console.error("Package data is empty or undefined");
    }
    return moneyTransferData.value;
  } catch (error) {
    console.error("Error fetching package data:", error);
    return [];
  }
},

  }
});
