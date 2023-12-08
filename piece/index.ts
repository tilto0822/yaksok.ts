import { YaksokError } from '../errors.ts'
import { Scope } from '../scope.ts'

function log(...args: unknown[]) {
    console.log('[DEBUG]', ...args)
}

export class Piece<JSType> {
    content: JSType
    config?: Record<string, unknown>

    constructor(value: JSType) {
        this.content = value
    }

    toJSON() {
        return {
            type: this.constructor.name,
            content: this.content,
        }
    }
}

class CallFrame {
    parent: CallFrame | undefined
    event: Record<string, (...args: any[]) => void> = {}

    constructor(piece: Piece<unknown>, parent?: CallFrame) {
        this.parent = parent
    }

    invokeEvent(name: string, ...args: unknown[]) {
        if (this.event[name]) {
            this.event[name](...args)
        } else if (this.parent) {
            this.parent.invokeEvent(name, ...args)
        } else {
            throw new YaksokError('EVENT_NOT_FOUND', {}, { name })
        }
    }
}

export class ExecutablePiece<ContentType> extends Piece<ContentType> {
    execute(scope: Scope, callFrame: CallFrame): void {
        throw new Error(`${this.constructor.name} has no execute method`)
    }
}

export class EvaluatablePiece<
    EvaluatedType,
    InternallySavedType,
> extends ExecutablePiece<InternallySavedType> {
    execute(
        scope: Scope,
        callFrame: CallFrame,
    ): Promise<ValuePiece<EvaluatedType>> | ValuePiece<EvaluatedType> {
        throw new Error('This EvaluatablePiece has no execute method')
    }
}

export class EOLPiece extends Piece<'\n'> {
    constructor() {
        super('\n')
    }
}

export class IndentPiece extends Piece<number> {
    constructor(size: number) {
        super(size)
    }
}

export class ValuePiece<
    T = string | number | boolean | string[] | number[] | boolean[],
> extends EvaluatablePiece<T, T> {
    constructor(content: T) {
        super(content)
        this.content = content
    }
    execute(scope: Scope, _callFrame: CallFrame): ValuePiece<T> {
        return this
    }
}

export class NumberPiece extends ValuePiece<number> {}
export class StringPiece extends ValuePiece<string> {}
export class BooleanPiece extends ValuePiece<boolean> {}

export class KeywordPiece extends Piece<string> {}

export class OperatorPiece extends Piece<string> {
    call(...operands: ValuePiece[]): ValuePiece {
        throw new Error('This OperatorPiece has no calc method')
    }
}

export class ExpressionPiece extends Piece<string> {}

export class PlusOperatorPiece extends OperatorPiece {
    constructor() {
        super('+')
    }
    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new NumberPiece(left.content + right.content)
        }

        if (left instanceof StringPiece && right instanceof StringPiece) {
            return new StringPiece(left.content + right.content)
        }

        if (left instanceof StringPiece) {
            return new StringPiece(left.content + right.content.toString())
        }

        if (right instanceof StringPiece) {
            return new StringPiece(left.content.toString() + right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_PLUS_OPERATOR')
    }
}

export class MinusOperatorPiece extends OperatorPiece {
    constructor() {
        super('-')
    }
    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands
        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new NumberPiece(left.content - right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_MINUS_OPERATOR')
    }
}

export class MultiplyOperatorPiece extends OperatorPiece {
    constructor() {
        super('*')
    }
    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands
        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new NumberPiece(left.content * right.content)
        }

        if (left instanceof StringPiece && right instanceof NumberPiece) {
            return new StringPiece(left.content.repeat(right.content))
        }

        throw new YaksokError('INVALID_TYPE_FOR_MULTIPLY_OPERATOR')
    }
}

export class DivideOperatorPiece extends OperatorPiece {
    constructor() {
        super('/')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new NumberPiece(left.content / right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_DIVIDE_OPERATOR')
    }
}

export class EqualOperatorPiece extends OperatorPiece {
    constructor() {
        super('=')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        return new BooleanPiece(left.content === right.content)
    }
}

export class AndOperatorPiece extends OperatorPiece {
    constructor() {
        super('이고')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (
            !(left instanceof BooleanPiece) ||
            !(right instanceof BooleanPiece)
        ) {
            throw new YaksokError('INVALID_TYPE_FOR_AND_OPERATOR')
        }

        return new BooleanPiece(left.content && right.content)
    }
}

export class GreaterThanOperatorPiece extends OperatorPiece {
    constructor() {
        super('>')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new BooleanPiece(left.content > right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_GREATER_THAN_OPERATOR')
    }
}

export class LessThanOperatorPiece extends OperatorPiece {
    constructor() {
        super('<')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new BooleanPiece(left.content < right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_LESS_THAN_OPERATOR')
    }
}

export class GreaterThanOrEqualOperatorPiece extends OperatorPiece {
    constructor() {
        super('>=')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new BooleanPiece(left.content >= right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_GREATER_THAN_OPERATOR')
    }
}

export class LessThanOrEqualOperatorPiece extends OperatorPiece {
    constructor() {
        super('<=')
    }

    call(...operands: ValuePiece[]) {
        if (operands.length !== 2) {
            throw new YaksokError('INVALID_NUMBER_OF_OPERANDS')
        }

        const [left, right] = operands

        if (left instanceof NumberPiece && right instanceof NumberPiece) {
            return new BooleanPiece(left.content <= right.content)
        }

        throw new YaksokError('INVALID_TYPE_FOR_LESS_THAN_OPERATOR')
    }
}

interface BinaryCalculationPieceContent {
    left: EvaluatablePiece<number | string, number | string | unknown>
    right: EvaluatablePiece<number | string, number | string | unknown>
    operator: OperatorPiece
}

export class BinaryCalculationPiece extends EvaluatablePiece<
    number | string | boolean | string[] | number[] | boolean[],
    BinaryCalculationPieceContent
> {
    constructor(props: BinaryCalculationPieceContent) {
        super(props)
    }
    async execute(scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        const { left, right, operator } = this.content

        const leftValue = await left.execute(scope, callFrame)
        const rightValue = await right.execute(scope, callFrame)

        return operator.call(leftValue, rightValue)
    }
}

interface UnaryCalculationPieceContent {
    operand: EvaluatablePiece<number, number>
    operator: OperatorPiece
}

export class ValueGroupPiece extends EvaluatablePiece<
    unknown,
    {
        value: EvaluatablePiece<unknown, unknown>
    }
> {
    execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        return this.content.value.execute(scope, callFrame)
    }
}

interface DeclareVariablePieceContent<T extends string | number> {
    name: VariablePiece
    content: EvaluatablePiece<T, T>
}

export class DeclareVariablePiece<
    T extends string | number,
> extends EvaluatablePiece<T, DeclareVariablePieceContent<T>> {
    async execute(scope: Scope, _callFrame: CallFrame): Promise<ValuePiece<T>> {
        const callFrame = new CallFrame(this, _callFrame)

        const { name, content } = this.content
        const value = await content.execute(scope, callFrame)

        if (name.content.name === '결과') {
            callFrame.invokeEvent('returnValue', value)

            return value
        }

        scope.setVariable(name.content.name, value)
        return value
    }
}

export class PlaceholderPiece extends Piece<null> {}

export class BlockPiece extends ExecutablePiece<Piece<unknown>[]> {
    async execute(scope: Scope, _callFrame?: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        for (let i = 0; i < this.content.length; i++) {
            const piece = this.content[i]
            if (piece instanceof ExecutablePiece) {
                await piece.execute(scope, callFrame)
            } else if (piece instanceof EOLPiece) {
                continue
            } else {
                // console.log(this.content)
                throw new YaksokError(
                    'CANNOT_PARSE',
                    {},
                    {
                        piece: JSON.stringify(piece),
                    },
                )
            }
        }
    }
}

interface ConditionPieceContent {
    condition: EvaluatablePiece<boolean, boolean>
    body: BlockPiece
}

export class ConditionPiece extends ExecutablePiece<ConditionPieceContent> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        const { condition, body } = this.content

        if ((await condition.execute(scope, callFrame)).content) {
            await body.execute(scope, callFrame)
        }
    }
}

export class PrintPiece extends ExecutablePiece<{
    expression: EvaluatablePiece<unknown, unknown>
}> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        console.log(
            'STDOUT',
            (await this.content.expression.execute(scope, _callFrame)).content,
        )
    }
}

export class VariablePiece extends EvaluatablePiece<
    string | number | boolean,
    {
        name: string
    }
> {
    constructor(args: { name: KeywordPiece }) {
        super({ name: args.name.content })
    }
    execute(scope: Scope, callFrame) {
        return scope.getVariable(this.content.name)
    }
}

export class FunctionDeclarationPiece extends ExecutablePiece<{
    body: BlockPiece
}> {
    constructor(props: { body: BlockPiece }) {
        super(props)
    }
    execute(scope: Scope) {
        const name = this.config?.name

        if (!name || typeof name !== 'string') {
            throw new YaksokError('FUNCTION_MUST_HAVE_NAME')
        }

        scope.setFunction(name, this)
    }

    async run(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        let returnValue: ValuePiece

        callFrame.event.returnValue = (value: ValuePiece) => {
            returnValue = value
        }

        await this.content.body.execute(scope, callFrame)

        return returnValue!
    }
}

export class FunctionInvokePiece extends EvaluatablePiece<
    unknown,
    {
        name: KeywordPiece
    }
> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        const name = this.config?.name

        if (!name || typeof name !== 'string') {
            throw new YaksokError('FUNCTION_MUST_HAVE_NAME')
        }

        const args = {}

        for (const key in this.content) {
            const value = this.content[key]
            if (value instanceof EvaluatablePiece) {
                args[key] = await value.execute(scope, callFrame)
            } else {
                throw new YaksokError(
                    'NOT_EVALUABLE_EXPRESSION',
                    {},
                    { piece: JSON.stringify(value) },
                )
            }
        }

        const func = scope.getFunction(name)

        const childScope = new Scope(scope, args)
        const result = await func.run(childScope, callFrame)

        return result || new ValuePiece(0)
    }
}

export class BreakPiece extends ExecutablePiece<null> {
    execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)
        callFrame.invokeEvent('break')
    }
}

export class RepeatPiece extends ExecutablePiece<{
    body: BlockPiece
}> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        let running = true

        callFrame.event.break = () => {
            running = false
        }

        while (true) {
            if (!running) break
            await this.content.body.execute(scope, callFrame)
        }
    }
}

export class EvaluatableSequencePiece extends EvaluatablePiece<
    unknown,
    {
        items: EvaluatablePiece<unknown, unknown>[]
    }
> {
    constructor(props: {
        a: EvaluatablePiece<unknown, unknown> | EvaluatableSequencePiece
        b: EvaluatablePiece<unknown, unknown> | EvaluatableSequencePiece
    }) {
        const { a, b } = props

        if (
            a instanceof EvaluatableSequencePiece &&
            b instanceof EvaluatablePiece
        ) {
            super({
                items: [...a.content.items, b],
            })
        } else if (
            a instanceof EvaluatablePiece &&
            b instanceof EvaluatableSequencePiece
        ) {
            super({
                items: [a, ...b.content.items],
            })
        } else if (
            a instanceof EvaluatablePiece &&
            b instanceof EvaluatablePiece
        ) {
            super({
                items: [a, b],
            })
        } else if (
            a instanceof EvaluatableSequencePiece &&
            b instanceof EvaluatableSequencePiece
        ) {
            super({
                items: [...a.content.items, ...b.content.items],
            })
        } else {
            throw new YaksokError('INVALID_TYPE_FOR_EVALUATABLE_SEQUENCE')
        }
    }

    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        const result = await this.content.items[
            this.content.items.length - 1
        ].execute(scope, callFrame)

        return result
    }
}

export class IndexablePiece<
    EvaluatedType,
    SavedType,
> extends ValuePiece<SavedType> {
    getIndex(
        scope: Scope,
        callFrame: CallFrame,
        index: ValuePiece<unknown>,
    ): ValuePiece | Promise<ValuePiece> {
        throw new Error(`${this.constructor.name} has no getIndex method`)
    }
}

export class SettableIndexablePiece<
    EvaluatedType,
    SavedType,
> extends IndexablePiece<EvaluatedType, SavedType> {
    setValueOfIndex(
        scope: Scope,
        callFrame: CallFrame,
        index: ValuePiece<unknown>,
        value: ValuePiece<unknown>,
    ): ValuePiece | Promise<ValuePiece> {
        throw new Error(`${this.constructor.name} has no setIndex method`)
    }
}

export class ListPiece extends SettableIndexablePiece<
    ValuePiece[],
    {
        content: EvaluatableSequencePiece
    }
> {
    async getIndex(
        scope: Scope,
        _callFrame: CallFrame,
        index: ValuePiece<unknown>,
    ) {
        const callFrame = new CallFrame(this, _callFrame)

        if (!(index instanceof NumberPiece)) {
            throw new YaksokError('LIST_INDEX_MUST_BE_NUMBER')
        }
        const indexValue = index.content - 1

        if (indexValue < 0)
            throw new YaksokError('LIST_INDEX_MUST_BE_GREATER_THAN_0')

        const list = await Promise.all(
            this.content.content.content.items.map((item) =>
                item.execute(scope, callFrame),
            ),
        )

        return list[indexValue] as ValuePiece
    }
    async setValueOfIndex(
        scope: Scope,
        callFrame: CallFrame,
        index: ValuePiece<unknown>,
        value: ValuePiece<unknown>,
    ) {
        if (!(index instanceof NumberPiece)) {
            throw new YaksokError('LIST_INDEX_MUST_BE_NUMBER')
        }

        const indexValue = index.content - 1

        if (indexValue < 0)
            throw new YaksokError('LIST_INDEX_MUST_BE_GREATER_THAN_0')

        this.content.content.content.items[indexValue] = value

        return value as ValuePiece
    }
}

export class IndexingPiece extends EvaluatablePiece<
    unknown,
    {
        index: EvaluatablePiece<number, number>
    }
> {
    execute(
        scope: Scope,
        callFrame: CallFrame,
    ): ValuePiece<unknown> | Promise<ValuePiece<unknown>> {
        return this.content.index.execute(scope, callFrame)
    }
}

export class IndexFetchPiece extends EvaluatablePiece<
    unknown,
    {
        target: IndexablePiece<unknown, unknown>
        index: IndexingPiece
    }
> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        const index = await this.content.index.execute(scope, callFrame)
        const target = await this.content.target.execute(scope, callFrame)

        if (!(target instanceof IndexablePiece)) {
            throw new YaksokError('INVALID_TYPE_FOR_INDEX_FETCH')
        }

        const value = target.getIndex(scope, callFrame, index)

        return value
    }
}

export class SetToIndexPiece extends ExecutablePiece<{
    target: IndexFetchPiece
    value: EvaluatablePiece<unknown, unknown>
}> {
    async execute(scope: Scope, _callFrame: CallFrame) {
        const callFrame = new CallFrame(this, _callFrame)

        const value = await this.content.value.execute(scope, callFrame)
        const targetSequence = await this.content.target.content.target.execute(
            scope,
            callFrame,
        )
        const targetIndex = await this.content.target.content.index.execute(
            scope,
            callFrame,
        )

        if (!(targetSequence instanceof SettableIndexablePiece)) {
            throw new YaksokError('INVALID_SEQUENCE_TYPE_FOR_INDEX_FETCH')
        }

        await targetSequence.setValueOfIndex(
            scope,
            callFrame,
            targetIndex,
            value,
        )
    }
}