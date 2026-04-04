import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Deploying to AWS | Production Deployment',
  description: 'Deploy CoFounder AI agents to AWS using ECS/Fargate, Lambda, API Gateway, RDS/Aurora, S3, and CDK/SST patterns.',
};

export default function Lesson4Page() {
  return (
    <div className="py-12 md:py-20">
      <div className="container-narrow">
        <div className="flex items-center justify-between mb-8">
          <Link href="/training/production-deployment" className="inline-flex items-center text-foreground-secondary hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
          <span className="text-sm text-foreground-secondary">Lesson 4 of 10</span>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Deploying to AWS</h1>
          <p className="lead">
            AWS gives you full control over infrastructure for CoFounder applications that need
            custom networking, GPU access, or compliance requirements. This lesson covers
            ECS/Fargate for containerized deployments, Lambda for serverless agent execution,
            and supporting services like RDS, S3, and API Gateway.
          </p>

          <h2>ECS/Fargate for Containerized Agents</h2>
          <p>
            ECS with Fargate is ideal for long-running agent processes that exceed Lambda&apos;s
            15-minute timeout. Fargate manages the underlying compute so you only define your
            container and resource requirements.
          </p>
          <div className="code-block"><pre><code>{`# task-definition.json
{
  "family": "cofounder-agent",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "agent",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/cofounder-app:latest",
      "portMappings": [
        { "containerPort": 3000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/prod/OPENAI_API_KEY"
        },
        {
          "name": "SUPABASE_SERVICE_ROLE_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/prod/SUPABASE_KEY"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/cofounder-agent",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "agent"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}`}</code></pre></div>

          <h2>Lambda for Serverless Agent Execution</h2>
          <p>
            AWS Lambda works well for event-driven agent tasks like processing webhooks, running
            scheduled cost reports, or handling short-lived agent interactions. Use Lambda with
            API Gateway for a fully serverless CoFounder API:
          </p>
          <div className="code-block"><pre><code>{`// lambda/agent-handler.ts
import { Handler, APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AgentExecutor } from '@waymakerai/aicofounder-core';

export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event) => {
  const body = JSON.parse(event.body ?? '{}');

  const agent = new AgentExecutor({
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxSteps: 10,
    timeoutMs: 25_000,
  });

  try {
    const result = await agent.execute(body.message, {
      userId: event.requestContext.authorizer?.userId,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: result.output, usage: result.tokenUsage }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Agent execution failed' }),
    };
  }
};`}</code></pre></div>

          <h2>API Gateway and Database Setup</h2>
          <p>
            API Gateway sits in front of your Lambda functions and provides authentication,
            throttling, and request validation. For the database layer, RDS PostgreSQL or
            Aurora Serverless v2 pairs well with Supabase-compatible schemas:
          </p>
          <div className="code-block"><pre><code>{`# CDK stack for API Gateway + RDS (TypeScript CDK)
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class CoFounderStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const vpc = new ec2.Vpc(this, 'AgentVpc', { maxAzs: 2 });

    // Aurora Serverless v2 for auto-scaling database
    const cluster = new rds.DatabaseCluster(this, 'AgentDb', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      vpc,
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      writer: rds.ClusterInstance.serverlessV2('writer'),
    });

    // S3 bucket for agent file uploads
    const bucket = new cdk.aws_s3.Bucket(this, 'AgentUploads', {
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{ expiration: cdk.Duration.days(90) }],
    });
  }
}`}</code></pre></div>

          <h2>SST for Full-Stack AWS Deployments</h2>
          <p>
            SST (Serverless Stack) simplifies full-stack deployments on AWS with first-class
            Next.js support. It handles Lambda, API Gateway, S3, and CloudFront in a single
            configuration file, making it an excellent choice for CoFounder projects that need
            AWS but want a smoother developer experience than raw CDK.
          </p>
          <p>
            Whichever AWS approach you choose, always store secrets in SSM Parameter Store or
            Secrets Manager rather than in environment files. Use IAM roles with least-privilege
            permissions, and enable CloudWatch logging from day one.
          </p>
        </article>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
          <Link href="/training/production-deployment/lesson-3" className="text-foreground-secondary hover:text-foreground transition-colors text-sm">
            &larr; Previous: Deploying to Vercel
          </Link>
          <Link href="/training/production-deployment/lesson-5" className="btn-primary px-6 py-3 group">
            Next: Docker Containerization
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
