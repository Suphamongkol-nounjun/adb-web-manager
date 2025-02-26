//src/app/api/route.js
export async function GET() {
    return Response.json({
      message: `GET method called`,
    });
  }
  
  
  export async function POST() {
    return Response.json({
      message: `POST method called`,
    });
  }
  
  
  export async function PUT() {
    return Response.json({
      message: `PUT method called`,
    });
  }
  
  
  export async function DELETE() {
    return Response.json({
      message: `DELETE method called`,
    });
  }