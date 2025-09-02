pipeline {
  agent any

  environment {
    IMAGE_NAME = 'bliveus-client'
    S3_BUCKET = 'your-s3-bucket-name'          // Replace with your actual bucket name
    S3_IMAGE_KEY = 'docker-images/bliveus-client.tar' // Path inside the bucket
    EC2_IP = '13.234.112.238'
    SSH_KEY_PATH = '/var/lib/jenkins/keys/client.pem'
  }

  stages {
    stage('Checkout Code') {
      steps {
        git branch: 'main', url: 'https://github.com/Tejaswini448/client.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }

    stage('Save Image and Upload to S3') {
      steps {
        sh '''
          docker save $IMAGE_NAME:latest -o ${IMAGE_NAME}.tar
          aws s3 cp ${IMAGE_NAME}.tar s3://$S3_BUCKET/$S3_IMAGE_KEY
        '''
      }
    }

    stage('Deploy to EC2') {
      steps {
        sh """
          ssh -o StrictHostKeyChecking=no -i $SSH_KEY_PATH ubuntu@$EC2_IP << EOF
            aws s3 cp s3://$S3_BUCKET/$S3_IMAGE_KEY /tmp/${IMAGE_NAME}.tar

            docker stop $IMAGE_NAME || true
            docker rm $IMAGE_NAME || true

            docker load -i /tmp/${IMAGE_NAME}.tar

            docker run -d --name $IMAGE_NAME -p 5173:5173 $IMAGE_NAME:latest
EOF
        """
      }
    }
  }
}
