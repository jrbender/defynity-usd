import React, { Component } from 'react';
import cn from 'classnames';
import { toast } from 'react-toastify';
import { generateUniqueId } from 'utils/utils';
import Card from '../../../../components/Card/Card';
import Switch from '../../../../components/Switch/Switch';
import { ergCoin, reserveName, usdAcronym, usdName } from '../../../../utils/consts';
import { feeToMintSc, feeToMintRc, priceToMintRc, maxScToMint, maxRcToMint, maxRcToRedeem, priceToMintSc, scNumCirc, amountFromRedeemingSc, amountFromRedeemingRc,feeFromRedeemingSc, feeFromRedeemingRc, rcPrice, scPrice } from '../../../../utils/ageHelper';
import { dollarToCent } from '../../../../utils/serializer';
import Loader from '../../../../components/Loader/Loader';
import { isWalletSaved } from '../../../../utils/helpers';
import { mintSc } from '../../../../utils/mintSc';
import InfoModal from '../../../../components/InfoModal/InfoModal';
import WalletModal from '../../../../components/WalletModal/WalletModal';
import { isNatural } from '../../../../utils/serializer';

import { redeemSc } from '../../../../utils/redeemSc';
import { currentHeight } from '../../../../utils/explorer';
import { mintRc } from '../../../../utils/mintRc';
import { redeemRc } from '../../../../utils/redeemRc';

export class BankForm extends Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            //purchase components
            loading: false,
            curHeight: NaN,
            
            //redeem components
            isModalOpen: false,

            requestId: null,
            inputChangeTimerId: null,
            address: '',
            errMsg: '',
            sigAmount: '',
            ergAmount:'',
            dueTime: null,
            ErgVal:0,
            ErgFee:0,
            payReceiveErgVal:0,

            purchaseFlag: true,
            redeemFlag: false,
            payReceiveString: 'Deposit',
            purchaseRedeemString:'Purchase',
            amountString:'Amount to deposit',
            zeroString: '',
            bgColor1: '#2d2d2d', //or do #hex values
            bgColor2:'',

            scPrice: NaN,
            rcPrice: NaN,
            selectValue: 'SigUSD',
            rate:NaN,
        };
    }

    async rateHelper() { //async
        const sc = await scPrice();
        const rc = rcPrice();
        /*this.setState({
            scPrice: (sc / 1e7).toFixed(8),
            //rate: (sc / 1e7).toFixed(8), //need to figure out  different solution
            rcPrice: (rc/ 1e7).toFixed(8),
        });*/
        if (this.state.selectValue==="SigUSD") {
            this.setState({rate:(sc/1e7).toFixed(8)});
        }
        if (this.state.selectValue==="SigRSV") {
            this.setState({rate:(rc/1e9).toFixed(8)});
        }
    }

    async initialRate () {
        const sc = await scPrice();
        const rc = rcPrice();
        this.setState({
            scPrice: (sc / 1e7).toFixed(8),
            rate: (sc / 1e7).toFixed(8), //need to figure out  different solution
            rcPrice: (rc/ 1e9).toFixed(8),
        });
    }

    componentDidMount() {
        this.initialRate();
        setInterval(() => {
            this.rateHelper();
        }, 10000);
        currentHeight().then((height) => this.setState({ curHeight: height }));
    }

    componentWillUnmount() {
        clearTimeout(this.state.inputChangeTimerId);
    }

    //combined params
    updateParams(amount: any, requestId: string) {
        if (!amount || !amount.trim()) {
            this.setState({
                ErgVal: 0,
                ErgFee: 0,
                payReceiveErgVal: 0,
                ergAmount: '',
            });
            return;
        }
        //purchase
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            if (this.state.selectValue==='SigUSD') {
                Promise.all([priceToMintSc(amount), feeToMintSc(amount)]).then(([tot, fee]) => {
                    if (this.state.requestId === requestId) {
                        this.setState({
                            ErgFee: fee / 1e9,
                            ErgVal: (tot - fee) / 1e9,
                            payReceiveErgVal: tot / 1e9,
                            ergAmount: (tot - fee) / 1e9,
                        });
                    }
                });
            }
            //add here
            if (this.state.selectValue==='SigRSV') {
                Promise.all([priceToMintRc(amount), feeToMintRc(amount)]).then(([tot, fee]) => {
                    if (this.state.requestId === requestId) {
                        this.setState({
                            ErgFee: fee / 1e9,
                            ErgVal: (tot - fee) / 1e9,
                            payReceiveErgVal: tot / 1e9,
                            ergAmount: (tot - fee) / 1e9,
                        });
                    }
                });
            }
        }

        //redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            if (this.state.selectValue==='SigUSD') {
                Promise.all([amountFromRedeemingSc(amount), feeFromRedeemingSc(amount)]).then(
                    ([tot, fee]) => {
                        if (this.state.requestId === requestId) {
                            this.setState({
                                ErgFee: fee / 1e9,
                                ErgVal: (tot + fee) / 1e9,
                                payReceiveErgVal: tot / 1e9,
                                ergAmount: (tot + fee) / 1e9,
                            });
                        }
                    },
                );
            }
            //add here
            if (this.state.selectValue==='SigRSV') {
                Promise.all([amountFromRedeemingRc(amount), feeFromRedeemingRc(amount)]).then(
                    ([tot, fee]) => {
                        if (this.state.requestId === requestId) {
                            this.setState({
                                ErgFee: fee / 1e9,
                                ErgVal: (tot + fee) / 1e9,
                                payReceiveErgVal: tot / 1e9,
                                ergAmount: (tot + fee) / 1e9,
                            });
                        }
                    },
                );
            }
        }
    }


    //combined isinputinvalid
    isInputInvalidSC(inp: number, requestId: string) {
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) { //%% this.state.sigAmountFlag = true then conv
            //if sc
            /*if (this.state.selectValue === 'SigUSD') {
                console.log('purchase sig')
            }*/
            maxScToMint().then((maxAllowed) => {
                if (this.state.requestId !== requestId) {
                    return;
                }
    
                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to mint more than ${(maxAllowed / 100).toFixed(
                            2,
                        )} ${usdName} based on the current reserve status`,
                    });
                    return;
                }
    
                this.setState({
                    errMsg: '',
                });
            });
        }

        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) { //&& this.state.ergAmountFlag = true then conv
            scNumCirc().then((maxAllowed) => {
                if (this.state.requestId !== requestId) {
                    return;
                }
    
                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to redeem more than ${(maxAllowed / 100).toFixed(
                            2,
                        )} ${usdName} based on current circulating supply`,
                    });
                    return;
                }
    
                this.setState({
                    errMsg: '',
                });
            });
        }
    }

    isInputInvalidRC(inp: number, requestId: string) {
        console.log('made it to isinputinvalidrc');
        //if purchase
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            console.log('made it to through purchaseflag');
            if ((!this.state.curHeight) || (isNaN(inp))) {
                console.log("in loop");
                this.setState({
                    errMsg: '',
                });
                return;
            }
            console.log(this.state.curHeight);
            console.log(inp);
            maxRcToMint(this.state.curHeight).then((maxAllowed) => {
                console.log("made it into maxrctomint"); //fixed error here by updating agehelper
                
                if (this.state.requestId !== requestId) {
                    return;
                }

                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to mint more than ${maxAllowed} ${reserveName} based on the current reserve status`,
                    });
                    return;
                }

                this.setState({
                    errMsg: '',
                });
            });
        }

        //if redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            console.log('made it to through redeemflag');
            maxRcToRedeem().then((maxAllowed) => {
                if (this.state.requestId !== requestId) {
                    return;
                }

                if (maxAllowed < inp) {
                    this.setState({
                        errMsg: `Unable to redeem more than ${maxAllowed} ${reserveName} based on the current reserve status`,
                    });
                    return;
                }

                this.setState({
                    errMsg: '',
                });
            });
        }
    }

    //do i need async??
    inputChange(inp: string) {
        clearTimeout(this.state.inputChangeTimerId);

        //change these flags to just equal selectValue and add rate = price of chosen coin
        const parts = inp.split('.');
        if (inp.startsWith('-') || (parts.length > 1 && parts[1].length > 2) || (!isNatural(inp))) return; 

        const timerId = setTimeout(() => {
            const requestId = generateUniqueId();
            this.setState({ requestId });

            //
            if (this.state.selectValue==='SigUSD') {
                this.isInputInvalidSC(dollarToCent(inp), requestId);
                //console.log("made it!");
            }
            if (this.state.selectValue==='SigRSV') {
                this.isInputInvalidRC(parseInt(inp), requestId);
                //console.log("in RSV!");
            }
            this.updateParams(inp, requestId);
        }, 200);
        
        this.setState({sigAmount:inp, inputChangeTimerId: timerId});

    }

    startInteraction() {
        if (!isWalletSaved()) {
            toast.warn('Please configure your wallet first.');
            this.setState({ isWalletModalOpen: true });
            return;
        }
        this.setState({ loading: true });


        //if redeem
        if ((this.state.purchaseFlag === false) && (this.state.redeemFlag === true)) {
            //sc
            if (this.state.selectValue === 'SigUSD') {
                redeemSc(this.state.sigAmount)
                    .then((res) => {
                        this.setState({
                            address: res.addr,
                            coin: usdName,
                            price: this.state.sigAmount,
                            isModalOpen: true,
                            loading: false,
                            mintNanoErgVal: 0,
                            dueTime: res.dueTime,
                        });
                    })
                    .catch((err) => {
                        toast.error(`Could not register the request.${err.message}`);
                        this.setState({ loading: false });
                    });
            }
            //rc
            if (this.state.selectValue === 'SigRSV') {
                redeemRc(this.state.sigAmount)
                    .then((res) => {
                        this.setState({
                            address: res.addr,
                            coin: reserveName,
                            price: this.state.sigAmount,
                            isModalOpen: true,
                            loading: false,
                            mintNanoErgVal: 0,
                            dueTime: res.dueTime,
                        });
                    })
                    .catch((err) => {
                        let { message } = err;
                        if (!message) message = err;
                        toast.error(`Could not register the request.\n${message}`);
                        this.setState({ loading: false });
                    });
            }
        }

        //IF PURCHASE
        if ((this.state.purchaseFlag === true) && (this.state.redeemFlag === false)) {
            //sc
            if (this.state.selectValue === 'SigUSD') {
                mintSc(this.state.sigAmount)
                    .then((res) => {
                        this.setState({
                            address: res.addr,
                            coin: 'ERG',
                            price: res.price / 1e9,
                            isModalOpen: true,
                            loading: false,
                            // mintNanoErgVal: 0,
                            dueTime: res.dueTime,
                        });
                    })
                    .catch((err) => {
                        toast.error(`Unable to register the request.${err.message}`);
                        this.setState({ loading: false });
                    });
            }
            //rc
            if (this.state.selectValue === 'SigRSV') {
                mintRc(this.state.sigAmount)
                    .then((res) => {
                        this.setState({
                            address: res.addr,
                            coin: ergCoin,
                            price: res.price / 1e9,
                            isModalOpen: true,
                            loading: false,
                            mintNanoErgVal: 0,
                            dueTime: res.dueTime,
                        });
                    })
                    .catch((err) => {
                        toast.error(`Could not register the request.${err.message}`);
                        this.setState({ loading: false });
                    });
            }
        }
    }

    selectHelper(inp:string) {
        //
        if (inp !== this.state.selectValue) {
            if (this.state.selectValue === 'SigUSD') {
                this.setState({rate: this.state.rcPrice});
            }
            if (this.state.selectValue === 'SigRSV') {
                this.setState({rate: this.state.scPrice});
            }
        }
        this.setState({selectValue: inp});
        

        //if selectValue = sigUSD then...or if = sigRSV then...

        this.inputChange(this.state.zeroString);

        //the selectvalue comparisons are not working....need to think of other way
        //make two small buttons?????
        
    }


    render() {
        return (
            <Card>
                <div className = "btn-row">
                <div className = "btn-column1">
                    <button id = "primary"
                        className="btn-choice"
                        onClick={() => {
                            this.setState({
                                purchaseFlag: true,
                                redeemFlag: false,
                                payReceiveString: 'Deposit',
                                amountString:'Amount to deposit',
                                purchaseRedeemString: 'Purchase',
                                bgColor1:'#2d2d2d',
                                bgColor2:'',
                                selectValue: 'SigUSD',
                            })
                                
                            this.inputChange(this.state.zeroString);
                        }}
                        style={{backgroundColor:this.state.bgColor1}}
                        >Purchase
                    </button>
                </div>
                <div className = "btn-column2">
                    <button id = "secondary"
                        className="btn-choice"
                        onClick={() => {
                            this.setState({
                                purchaseFlag: false,
                                redeemFlag: true, 
                                payReceiveString: 'Withdrawal',
                                amountString:'Amount to withdraw',
                                purchaseRedeemString: 'Redeem',
                                bgColor1:'',
                                bgColor2:'#2d2d2d',
                                selectValue: 'SigUSD',
                            })
                            
                            this.inputChange(this.state.zeroString);
                        }}
                        style={{backgroundColor:this.state.bgColor2}}
                        >Redeem
                    </button>
                </div>
                </div>
                <div className="delimiter" />
                <div className="input mt-xl-20 mb-xl-20 mt-15 mb-15 mt-lg-20 mb-lg-20">
                    <div className="input-group">
                        <input
                            value={this.state.sigAmount}
                            step="1"
                            onChange={(e) => {
                                this.inputChange(e.target.value);
                            }}
                            type="number"
                            placeholder="0.0 " 
                        />
                        <div className = "bankCoin">
                            <select value = {this.state.selectValue} onChange={(e) => {this.selectHelper(e.target.value)}} >
                                <option value="SigUSD">SigUSD</option>
                                <option value="SigRSV">SigRSV</option>
                            </select>
                        </div>
                    </div>
                </div>
                <Switch leftSide= '' rightSide='' />
                <div className="input-other mt-xl-20 mb-xl-20 mt-15 mb-15 mt-lg-20 mb-lg-20">
                    <div className="input-group">
                        <input
                            value={this.state.ergAmount}
                            step="1"
                            readOnly
                            onChange={(e) => {
                                this.inputChange(e.target.value);
                            }}
                            type="number"
                            placeholder= {this.state.amountString}
                        />
                        <div className = "outCoin">
                            ERG
                        </div>
                    </div>
                    <span
                        className={cn('input__subtext', {
                            error: this.state.errMsg,
                        })}
                    >
                        {this.state.errMsg
                            ? this.state.errMsg
                            : '*A fee is charged for currency conversion'}
                    </span>
                </div>
                <div className="delimiter" />
                <div className ="terms-row">
                    <div className = "terms-col1">
                        <p>
                            Rate:
                        </p>
                    </div>
                    <div className = "terms-col2">
                        <p>
                            1 {this.state.selectValue} =  {(1 * this.state.rate).toFixed(5)} ERG
                        </p>
                    </div>
                </div>
                <div className = "terms-row">
                    <div className = "terms-col1"><p>Fee: </p></div>
                    <div className = "terms-col2"><p>{this.state.ErgFee.toFixed(3)} ERG </p></div>
                </div>
                <div className="delimiter" />
                <div className="terms-row">
                    <div className = "terms-col1">
                        <p>
                            Total {this.state.payReceiveString}:
                        </p>
                    </div>
                    <div className = "terms-col2">
                        <p>
                            {' '}
                            {this.state.payReceiveErgVal.toFixed(3)} ERG{' '}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => this.startInteraction()}
                    disabled={this.state.loading || this.state.errMsg || !this.state.sigAmount}
                    className="mt-sm-15 mt-xl-40 mt-lg-25 btn btn--white"
                >
                    {this.state.loading ? <Loader /> : this.state.purchaseRedeemString}
                </button>
                <InfoModal
                    coin={this.state.coin}
                    address={this.state.address}
                    value={this.state.price}
                    open={this.state.isModalOpen}
                    onClose={() => this.setState({ isModalOpen: false })}
                    dueTime={this.state.dueTime}
                />
                <WalletModal
                    onClose={() => this.setState({ isWalletModalOpen: false })}
                    open={this.state.isWalletModalOpen}
                />
            </Card>
        );
    }
}
export default BankForm;