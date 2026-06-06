// =====================================================================
// Pipeline CI/CD TontineApp
// Déclenché manuellement ou sur push : Checkout (GitHub) → Verify → Deploy.
// Le déploiement se fait via kubectl, authentifié in-cluster par le service
// account `default` du namespace tontineapp (droits accordés par jenkins-rbac.yaml).
// kubectl est installé dans le PVC Jenkins (/var/jenkins_home/kubectl).
// =====================================================================

pipeline {
  agent any

  environment {
    KUBECTL = '/var/jenkins_home/kubectl'
    REPO    = 'https://github.com/NLP1703/tontineapp.git'
  }

  options {
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        sh 'rm -rf src'
        sh "git clone --depth 1 ${REPO} src"
        sh 'cd src; git log -1 --oneline'
      }
    }

    stage('Verify') {
      steps {
        dir('src') {
          sh '''
            test -f Jenkinsfile
            test -d services/auth-service
            test -d services/tontine-service
            test -d services/notification-service
            test -d frontend
            echo Structure-OK
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sh "${KUBECTL} -n tontineapp rollout restart deployment/auth-service deployment/tontine-service deployment/notification-service deployment/frontend"
        sh "${KUBECTL} -n tontineapp rollout status deployment/tontine-service --timeout=180s"
        sh "${KUBECTL} -n tontineapp get pods -o wide"
      }
    }
  }

  post {
    success { echo '✅ Pipeline réussi — nouveau rollout déployé sur Kubernetes.' }
    failure { echo '❌ Pipeline en échec — voir les logs.' }
  }
}
