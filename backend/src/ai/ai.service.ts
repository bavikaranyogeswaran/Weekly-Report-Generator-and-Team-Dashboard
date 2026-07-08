import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
  private readonly groq: Groq;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.getOrThrow<string>('GROQ_API_KEY');

    // Model and key come from env — never hardcoded
    this.modelName = config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
    this.groq = new Groq({ apiKey });
  }

  // Sends a prompt to the configured Groq model and returns the response text.
  // Throws 500 if the API call fails so the caller always gets a clean error.
  protected async generate(prompt: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
      });

      return completion.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Groq API error: ${err?.message ?? 'unknown error'}`,
      );
    }
  }
}
