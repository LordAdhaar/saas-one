import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import OpenAI from 'openai';
import  {increaseApiLimit, checkApiLimit} from "@/lib/api-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
});

export async function POST(
    req:Request
){
    try {
        const {userId} = auth();
        const body = await req.json();
        const {messages} = body;

        if(!userId){
            return new NextResponse("Unauthorized", {status:401});
        }

        if(!openai.apiKey){
            return new NextResponse("OpenAI API Key not configures", {status:500});
        }

        if(!messages){
            return new NextResponse("Messages are requires",{status:400});
        }

        const freeTrial = await checkApiLimit()

        if (!freeTrial){
            return new NextResponse("Free Trial has expired", {status:403})
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages});

        await increaseApiLimit();

        return NextResponse.json(response.choices[0].message);

    } catch (error) {
        console.log("[CONVERSATION_ERROR]", error)
        return new NextResponse("INTERNAL ERROR", {status:500})
    }
}