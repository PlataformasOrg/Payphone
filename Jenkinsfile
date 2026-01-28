pipeline {
    agent any

    tools {
        nodejs "Node25"
        dockerTool "Dockertool"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Ejecutar tests') {
            steps {
                dir('backend') {
                    // ✅ Fix permisos (por si Jenkins/Linux marca "permission denied")
                    sh 'chmod +x ./node_modules/.bin/jest  true'
                    sh 'npm test -- --ci --runInBand'
                }
            }
        }

        stage('Construir imagen Docker') {
            steps {
                dir('backend') {
                    sh 'docker build -t payphone-app:latest .'
                }
            }
        }

        stage('Desplegar contenedor') {
            steps {
                sh '''
                  docker stop payphone-app  true
                  docker rm payphone-app || true
                  docker run -d --name payphone-app -p 3001:3001 payphone-app:latest
                '''
            }
        }
    }
}