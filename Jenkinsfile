pipeline {
    agent any

    // Tell Jenkins to inject the Node.js version we just configured!
    tools {
        nodejs 'Node18' 
    }

    // Inject our dummy variables so the backend doesn't crash during tests
    environment {
        GEMINI_API_KEY = "dummy_key_just_to_pass_the_error_check"
        JWT_SECRET = "dummy_secret_for_jwt_signing"
        RESEND_API_KEY = "dummy_resend_key"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // This pulls your latest code from GitHub
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Navigate into the backend folder and run npm install
                dir('matchingdonors-backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Run QA Tests') {
            steps {
                // Run the exact same tests we ran in GitHub Actions
                dir('matchingdonors-backend') {
                    sh 'npm test -- health.test.ts admin.security.test.ts rbac.integration.test.ts'
                }
            }
        }
    }

    // This block runs after the stages finish, giving us a clean status output
    post {
        success {
            echo '✅ ENTERPRISE PIPELINE SUCCESS: All tests passed!'
        }
        failure {
            echo '❌ ENTERPRISE PIPELINE FAILED: Check the logs above.'
        }
    }
}