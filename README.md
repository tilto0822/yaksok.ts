# yaksok.ts

타입스크립트로 구현한 [약속 프로그래밍 언어](http://yaksok.org/)의 인터프리터

-   라이브러리 종속성이 없습니다
-   브라우저에서 실행할 수 있습니다. [데모 보러가기 (https://yaksok-ts.pages.dev/)](https://yaksok-ts.pages.dev/)

## 왜 만들었나요?

약속 프로그래밍 언어는 교육적으로 훌륭한 언어입니다. 다양한 환경에서 편리하게 약속을 실행할 수 있도록 타입스크립트로 새 런타임을 작성하였습니다.

기준 개발 환경은 Deno(1.38.4)입니다.

## 아직 Unstable합니다!

실행되지 않는 코드가 있다면 이슈에 남겨주세요. 파악된 이슈는 다음과 같습니다:

1. if-else if-else 구문이 올바르게 파싱되지 않음

```
시리얼: "1032"

만약 시리얼 = "1032" 이면
    결과: "1.0.0"
아니면 만약 시리얼 = "1033" 이면
    결과: "1.0.1"
아니면
    결과: "UNKNOWN"
```

## 테스트해보기

```typescript
import { yaksok } from './index.ts'

let stderr = ''

yaksok({
    main: `
보드_시리얼: "1032"

만약 @아두이노 모델명 = "Arduino Uno" 이면
    "아두이노 모델명이 맞습니다." 보여주기
    @아두이노 보드_시리얼 버전 보여주기
`,
    아두이노: `
약속 시리얼 "버전"
    만약 시리얼 = "1032" 이면
        결과: "1.0.0"
    아니면
        만약 시리얼 = "1033" 이면
            결과: "1.0.1"
        아니면
            결과: "UNKNOWN"

모델명: "Arduino Uno"
`,
})
```

```
약속 "피보나치" 수
    만약 수 < 3 이면
        결과: 1
    아니면
        결과: (피보나치 (수 - 1)) + (피보나치 (수 - 2))

횟수: 1

반복
    횟수 + "번째 피보나치 수는 " + (피보나치 횟수) + "입니다" 보여주기
    횟수: 횟수 + 1

    만약 횟수 > 10 이면
        반복 그만
```

```
약속 과일"을/를 멋있는 " 사람 "와/과 먹기"
    사람 + ": " + 과일 + " 먹음" 보여주기

"사과"를 멋있는 "김철수"와 먹기
```

Made by Rycont, with ❤️, in 사이버지식정보방
