import {
    Block,
    DeclareFFI,
    DeclareFunction,
    Expression,
    FFIBody,
    Identifier,
    Node,
} from '../../../../../node/index.ts'
import { BRACKET_TYPE, isBracket } from '../../../../../util/isBracket.ts'

export type FunctionHeaderNode = Identifier | Expression
export const functionRuleByType = {
    ffi: {
        prefix: [
            {
                type: Identifier,
                value: '번역',
            },
            {
                type: Expression,
                value: '(',
            },
            {
                type: Identifier,
            },
            {
                type: Expression,
                value: ')',
            },
            {
                type: Expression,
                value: ',',
            },
        ],
        body: FFIBody,
        createFactory(functionHeader: FunctionHeaderNode[], name: string) {
            return (tokens: Node[]) => {
                const params = functionHeader
                    .filter((node, index) => {
                        const previousNode = functionHeader[index - 1]
                        const isPreviousNodeOpeningBracket =
                            previousNode instanceof Expression &&
                            isBracket(previousNode) === BRACKET_TYPE.OPENING

                        return (
                            isPreviousNodeOpeningBracket &&
                            node instanceof Identifier
                        )
                    })
                    .map((node) => (node as Identifier).value)

                return new DeclareFFI(
                    name,
                    (tokens[tokens.length - 1] as FFIBody).code,
                    (tokens[2] as Identifier).value,
                    params,
                )
            }
        },
    },
    yaksok: {
        prefix: [
            {
                type: Identifier,
                value: '약속',
            },
            {
                type: Expression,
                value: ',',
            },
        ],
        body: Block,
        createFactory:
            (_functionHeader: FunctionHeaderNode[], name: string) =>
            (tokens: Node[]) =>
                new DeclareFunction({
                    name,
                    body: tokens[tokens.length - 1] as Block,
                }),
    },
}
