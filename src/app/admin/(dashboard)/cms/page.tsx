import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";
import CmsForm from "./CmsForm";

export default async function AdminCmsSettings() {
  await dbConnect();
  
  // Fetch existing settings
  const settings = await Setting.find();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="w-full">
      <CmsForm initialData={settingsMap} />
    </div>
  );
}
