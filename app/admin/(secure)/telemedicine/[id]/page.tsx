import { SubmissionDetail } from "@/components/admin/SubmissionDetail"; export default async function Page({params}:{params:Promise<{id:string}>}){return <SubmissionDetail kind="telemedicine" id={(await params).id}/>}

