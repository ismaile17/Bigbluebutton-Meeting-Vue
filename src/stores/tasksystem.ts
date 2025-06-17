import { defineStore } from 'pinia';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';


const baseUrl = `${import.meta.env.VITE_API_URL}`;


export const useTaskSystem = defineStore({
    id: 'tasksystems',
    state: () => ({
        createoredittask: {} as any,
        editsubmission: {} as any,
        submissioncreateforteacher: {} as any,
        tasksByGroupId:[] as any[],
        tasks: {},
        submissionlist: {},



    }),

    actions: {
        async createOrEditUserDetail(args: any) {
            const task1 = await fetchWrapper.post(`${baseUrl}/task/createoredit`, args);
            this.createoredittask = task1;
            return task1;
          },

          async editSubmissionForParticipant(args: any) {
            const task1 = await fetchWrapper.post(`${baseUrl}/task/editsubmission`, args);
            this.editsubmission = task1;
            return task1;
          },

        async getAllTasksByGroupId(groupId:any){
            
            const groupData = await fetchWrapper.get(`${baseUrl}/task/getalltaskbygroupid?groupId=${groupId}`).then((x) => {
                this.tasks = x.value
                return x;
            });
            return groupData;
        },

        async getAllSubmissionListByAssignmentId(taskAssignmentId:any){
            
            const groupData = await fetchWrapper.get(`${baseUrl}/task/getalltasksubmissionresponted?taskAssignmentId=${taskAssignmentId}`).then((x) => {
                this.submissionlist = x.value
                return x;
            });
            return groupData;
        },

        async softDeleteTaskAssignment(id:any) {
            const deleteResponse = await fetchWrapper.delete(`${baseUrl}/task/soft-delete/${id}`);
            return deleteResponse;
        },

        async createTaskAssignmentSubmissionDetails(args: any) {
            const task2 = await fetchWrapper.post(`${baseUrl}/task/createtaskassignmentsubmissiondetails`, args);
            this.submissioncreateforteacher = task2;
            return task2;
          },


    }
});