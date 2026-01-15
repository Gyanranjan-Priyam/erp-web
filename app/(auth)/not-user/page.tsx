import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotUser() {
  return(
    <>
    <div className="flex min-h-50vh flex-col items-center justify-center px-4 sm:px-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4 text-center">Access Denied</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-50vh flex-col items-center justify-center px-4 sm:px-6">
      <p className="text-lg">You are not an authorized user.</p>
    </div>
      </CardContent>
    </Card>
    </div>
    </>
  )
}

