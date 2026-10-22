provider "aws" {
  region = "ap-southeast-1" # Singapore region
}

# ==========================================
# 1. LAMBDA EXECUTION ROLE (For the app to run)
# ==========================================
resource "aws_iam_role" "lambda_exec" {
  name = "serverless_fastapi_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ==========================================
# 2. THE LAMBDA FUNCTION & URL
# ==========================================
resource "aws_lambda_function" "fastapi_backend" {
  function_name = "food-ecommerce-backend"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "main.handler"
  runtime       = "python3.12"
  timeout       = 15

  filename         = "../backend/deployment.zip" 
  source_code_hash = filebase64sha256("../backend/deployment.zip")

  environment {
    variables = {
      DATABASE_URL = var.db_url
    }
  }
}

resource "aws_lambda_function_url" "api_url" {
  function_name      = aws_lambda_function.fastapi_backend.function_name
  authorization_type = "NONE" 
}

# ==========================================
# 3. GITHUB ACTIONS IAM USER (For CI/CD)
# ==========================================
resource "aws_iam_user" "github_actions" {
  name = "github-actions-deployer"
}

resource "aws_iam_access_key" "github_actions_key" {
  user = aws_iam_user.github_actions.name
}

resource "aws_iam_user_policy" "github_actions_policy" {
  name = "GitHubActionsLambdaUpdate"
  user = aws_iam_user.github_actions.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["lambda:UpdateFunctionCode"]
        # Automatically targets the exact ARN of the Lambda function created above
        Resource = aws_lambda_function.fastapi_backend.arn
      }
    ]
  })
}

# ==========================================
# VARIABLES & OUTPUTS
# ==========================================
variable "db_url" {
  type      = string
  sensitive = true
}

output "api_endpoint" {
  description = "Paste this into your React frontend"
  value       = aws_lambda_function_url.api_url.function_url
}

output "github_access_key_id" {
  description = "Paste into GitHub Secret: AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.github_actions_key.id
}

output "github_secret_access_key" {
  description = "Paste into GitHub Secret: AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.github_actions_key.secret
  sensitive   = true
}