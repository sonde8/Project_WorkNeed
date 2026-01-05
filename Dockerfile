FROM eclipse-temurin:17-jdk-alpine
# build/libs 폴더에 생성되는 jar 파일을 복사합니다.
COPY build/libs/*SNAPSHOT.jar project.jar
ENTRYPOINT ["java", "-jar", "project.jar"]