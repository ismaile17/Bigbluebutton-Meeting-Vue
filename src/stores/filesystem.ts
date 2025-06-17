import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}/FileSystem`;

export const useFileSystem = defineStore({
    id: 'filesystems',
    state: () => ({
        files: [] as any[], // Dosya listesini saklamak için
        downloadLink: null, // İndirme linki saklamak için
        uploadResult: null,  // Upload işleminin sonucunu saklamak için
        deleteResult: null  // Delete işleminin sonucunu saklamak için
    }),
    actions: {
        async uploadFile(formData: FormData) {
            try {
                const uploadResult = await fetchWrapper.post(`${baseUrl}/upload`, formData);
                this.uploadResult = uploadResult;
                return uploadResult;
            } catch (error) {
                console.error('Upload failed:', error);
                throw error;
            }
        },

        async deleteFile(fileId: number) {
            const deleteResult = await fetchWrapper.delete(`${baseUrl}/delete?fileId=${fileId}`).then((x) => {
                this.deleteResult = x;
                return x;
            });
            return deleteResult;
        },

        async getDownloadLink(fileId: number) {
            const response = await fetchWrapper.get(`${baseUrl}/download-link?fileId=${fileId}`);
            if (response.success) {
              // İndirme linki 'message' alanında geliyor
              this.downloadLink = response.message;
              return response.message;
            } else {
              throw new Error('İndirme linki alınamadı');
            }
          },

        async uploadMultipleFiles(formData: FormData) {
            const uploadResult = await fetchWrapper.post(`${baseUrl}/upload-multiple`, formData).then((x) => {
                this.uploadResult = x;
                return x;
            });
            return uploadResult;
        },

        async getFileListByUserId(pageId: number, pageType: string) {
            const fileList = await fetchWrapper.get(`${baseUrl}/getfilelist-byuserid?pageId=${pageId}&pageType=${pageType}`).then((x) => {
                this.files = x.value;
                return x;
            });
            return fileList;
        }
    }
});
