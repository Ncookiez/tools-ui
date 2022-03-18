import FeatherIcon from 'feather-icons-react'
import { SelectNetworkModal } from '@components/SelectNetworkModal'
import { useTicket } from '@hooks/v4/useTicket'
import { useUsersAddress } from '@hooks/wallet/useUsersAddress'
import { useTokenBalance } from '@pooltogether/hooks'
import {
  BlockExplorerLink,
  BottomSheet,
  NetworkIcon,
  SquareButton,
  SquareButtonTheme,
  ThemedClipSpinner,
  TokenIcon
} from '@pooltogether/react-components'
import { getNetworkNiceNameByChainId, shorten } from '@pooltogether/utilities'
import classNames from 'classnames'
import { useState } from 'react'
import { useDelegationSupportedChainIds } from './hooks/useDelegationSupportedChainIds'
import { getTwabDelegatorContractAddress } from './utils/getTwabDelegatorContractAddress'
import { useForm } from 'react-hook-form'
import { StyledInput } from '@components/Input'
import { isAddress } from 'ethers/lib/utils'
import { getPoolTogetherDepositUrl } from '@utils/getPoolTogetherDepositUrl'

interface UsersDelegationStateProps {
  className?: string
  chainId: number
  delegator: string
  setChainId: (chainId: number) => void
  setDelegator: (delegator: string) => void
}

export const UsersDelegationState: React.FC<UsersDelegationStateProps> = (props) => {
  const { className, chainId, setChainId, setDelegator, delegator } = props
  const ticket = useTicket(chainId)
  const twabDelegator = getTwabDelegatorContractAddress(chainId)
  const { data: ticketBalance, isFetched: isTicketBalanceFetched } = useTokenBalance(
    chainId,
    delegator,
    ticket.address
  )
  const { data: delegationBalance, isFetched: isDelegationBalanceFetched } = useTokenBalance(
    chainId,
    delegator,
    twabDelegator
  )

  return (
    <div className={classNames(className, 'flex justify-between')}>
      <div className='flex flex-col'>
        <div className='space-x-2 flex items-center'>
          <BlockExplorerLink chainId={chainId} address={delegator} shorten noIcon />
          <ChangeDelegatorButton delegator={delegator} setDelegator={setDelegator} />
          <ClearDelegatorButton delegator={delegator} setDelegator={setDelegator} />
        </div>
        <div className='flex space-x-2 items-center'>
          <TokenIcon chainId={chainId} address={ticket.address} sizeClassName='w-4 h-4' />
          <span className='opacity-60'>{ticket.symbol}</span>
          <a
            className='text-pt-teal hover:opacity-70 transition underline text-xxxs flex space-x-1 items-center'
            href={getPoolTogetherDepositUrl(chainId)}
            target='_blank'
            rel='noreferrer'
          >
            <span>{`Get ${ticket.symbol}`}</span>
            <FeatherIcon icon='external-link' className='w-3 h-3' />
          </a>
        </div>
        {delegator && (
          <div className='flex flex-col xs:flex-row xs:space-x-4 xs:items-center'>
            {(!isDelegationBalanceFetched || !isDelegationBalanceFetched) && (
              <ThemedClipSpinner sizeClassName='w-3 h-3' />
            )}
            {isDelegationBalanceFetched && (
              <div className='flex space-x-1 items-center'>
                <FeatherIcon icon='gift' className='w-3 h-3 text-pt-teal' />
                <span className='opacity-60 text-xxs'>{`${delegationBalance.amountPretty} delegated`}</span>
              </div>
            )}
            {isTicketBalanceFetched && (
              <div className='flex space-x-1 items-center'>
                <FeatherIcon icon='credit-card' className='w-3 h-3 text-pt-teal' />
                <span className='opacity-60 text-xxs'>{`${ticketBalance.amountPretty} balance`}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <DelegationNetworkSelection chainId={chainId} setChainId={setChainId} />
    </div>
  )
}

const DelegationNetworkSelection: React.FC<{
  chainId: number
  setChainId: (chainId: number) => void
}> = (props) => {
  const { chainId, setChainId } = props
  const [isOpen, setIsOpen] = useState(false)
  const chainIds = useDelegationSupportedChainIds()

  return (
    <>
      <button onClick={() => setIsOpen(true)} className='flex transition hover:opacity-70'>
        <NetworkIcon chainId={chainId} className='mr-2' sizeClassName='w-5 h-5' />
        <div className='flex flex-col items-start'>
          <span className='capitalize leading-none tracking-wider text-lg'>
            {getNetworkNiceNameByChainId(chainId)}
          </span>
          <span className='text-pt-teal text-xxxs'>change network</span>
        </div>
      </button>
      <SelectNetworkModal
        label='select-delegation-modal'
        isOpen={isOpen}
        description={'Select a network to manage delegations on'}
        selectedChainId={chainId}
        chainIds={chainIds}
        setSelectedChainId={setChainId}
        setIsOpen={setIsOpen}
      />
    </>
  )
}

const ClearDelegatorButton: React.FC<{
  delegator: string
  setDelegator: (delegator: string) => void
}> = (props) => {
  const { delegator, setDelegator } = props
  const usersAddress = useUsersAddress()

  if (delegator === usersAddress) return null

  return (
    <button onClick={() => setDelegator(usersAddress)}>
      <FeatherIcon icon='x' className='text-pt-red-light w-5 h-5  transition hover:opacity-70' />
    </button>
  )
}

const ChangeDelegatorButton: React.FC<{
  delegator: string
  setDelegator: (delegator: string) => void
}> = (props) => {
  const { delegator, setDelegator } = props
  const [isOpen, setIsOpen] = useState<boolean>(false)

  if (!delegator) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='transition hover:text-pt-teal items-center'
      >
        <FeatherIcon icon='refresh-cw' className='w-4 h-4' />
      </button>
      <ChangeDelegatorModal
        isOpen={isOpen}
        delegator={delegator}
        setDelegator={setDelegator}
        setIsOpen={setIsOpen}
      />
    </>
  )
}

export const ChangeDelegatorModal: React.FC<{
  isOpen: boolean
  delegator: string
  setDelegator: (delegator: string) => void
  setIsOpen: (isOpen: boolean) => void
}> = (props) => {
  const { isOpen, delegator, setDelegator, setIsOpen } = props

  const usersAddress = useUsersAddress()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<{ delegator: string }>({
    mode: 'onTouched',
    defaultValues: { delegator },
    shouldUnregister: true
  })

  const onSubmit = (v: { delegator: string }) => {
    setDelegator(v.delegator)
    setIsOpen(false)
    reset()
  }

  return (
    <BottomSheet label='delegator-change-modal' open={isOpen} onDismiss={() => setIsOpen(false)}>
      <h6 className='text-center uppercase text-sm mb-3 mt-2'>Set a delegator</h6>
      <p className='max-w-xs mx-auto text-xs mb-8 text-center'>
        Enter an address below to view it's delegations
      </p>
      <form
        onSubmit={handleSubmit((v) => onSubmit(v))}
        autoComplete='off'
        className='flex flex-col'
      >
        {/* TODO: Is this clearer than the clear button? Showing a shortcut to fill input with the users address. */}
        {/* {usersAddress && (
          <button
            type='button'
            className='transition ml-auto font-bold text-pt-teal hover:opacity-70'
            disabled={!isValid}
            onClick={() => setValue('delegator', usersAddress, { shouldValidate: true })}
          >
            {shorten({ hash: usersAddress })}
          </button>
        )} */}
        <StyledInput
          id='delegator'
          invalid={!!errors.delegator}
          className='w-full mb-4'
          placeholder='0xabc...'
          {...register('delegator', {
            required: {
              value: true,
              message: 'Delegator is required'
            },
            validate: {
              isAddress: (v) => isAddress(v) || 'Invalid address'
            }
          })}
        />
        <SquareButton className='w-full' disabled={!isValid}>
          View Delegations
        </SquareButton>
        {usersAddress && delegator && usersAddress !== delegator && (
          <SquareButton
            type='button'
            className='w-full mt-4'
            theme={SquareButtonTheme.orangeOutline}
            onClick={() => {
              setDelegator(usersAddress)
              setIsOpen(false)
            }}
          >
            Clear Delegator
          </SquareButton>
        )}
      </form>
    </BottomSheet>
  )
}
